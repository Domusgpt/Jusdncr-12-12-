import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';
import 'package:file_picker/file_picker.dart';
import '../models/dkg_file.dart';
import '../services/audio_analyzer.dart';
import '../engine/golem_mixer.dart';
import '../widgets/dkg_canvas.dart';
import '../widgets/touch_zone.dart';
import '../widgets/pattern_joystick.dart';

/// Main player screen
class PlayerScreen extends StatefulWidget {
  final DKGFile dkg;

  const PlayerScreen({super.key, required this.dkg});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen>
    with SingleTickerProviderStateMixin {
  late GolemMixer _mixer;
  late AudioAnalyzer _analyzer;
  late AudioPlayer _audioPlayer;
  late Ticker _ticker;

  bool _isPlaying = false;
  bool _showJoystick = false;
  Offset _joystickPosition = Offset.zero;
  double _lastTime = 0;
  String _audioSource = 'none'; // 'none', 'file', 'mic'

  // UI state
  bool _showControls = true;
  Timer? _hideControlsTimer;

  @override
  void initState() {
    super.initState();

    // Initialize engine
    _mixer = GolemMixer(widget.dkg);
    _analyzer = AudioAnalyzer();
    _audioPlayer = AudioPlayer();

    // Set up ticker for animation loop
    _ticker = createTicker(_onTick);
    _ticker.start();

    // Listen to audio player state
    _audioPlayer.playingStream.listen((playing) {
      setState(() {
        _isPlaying = playing;
      });
    });

    // Hide system UI for immersive experience
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    _ticker.dispose();
    _audioPlayer.dispose();
    _analyzer.dispose();
    _hideControlsTimer?.cancel();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _onTick(Duration elapsed) {
    final currentTime = elapsed.inMicroseconds / 1000000.0;
    final deltaTime = currentTime - _lastTime;
    _lastTime = currentTime;

    // Simulate audio if no real source
    if (_audioSource == 'none') {
      _analyzer.simulateAudio(currentTime);
    }

    // Update mixer
    _mixer.update(_analyzer.current, deltaTime);

    // Trigger rebuild
    setState(() {});
  }

  void _resetHideTimer() {
    _hideControlsTimer?.cancel();
    setState(() {
      _showControls = true;
    });
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _showControls = false;
        });
      }
    });
  }

  Future<void> _pickAudioFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.audio,
    );

    if (result != null && result.files.single.path != null) {
      final path = result.files.single.path!;
      await _audioPlayer.setFilePath(path);
      _audioPlayer.play();
      setState(() {
        _audioSource = 'file';
      });
    }
  }

  void _toggleMicrophone() {
    // TODO: Implement microphone capture with flutter_audio_capture
    setState(() {
      _audioSource = _audioSource == 'mic' ? 'none' : 'mic';
    });
  }

  void _onModeChange(EngineMode mode) {
    _mixer.setMode(mode);
    setState(() {});
  }

  void _onTouchMove(double x, double y) {
    _mixer.setKineticPosition(x, y);
    setState(() {
      _showJoystick = true;
    });
  }

  void _onTouchEnd() {
    _mixer.setKineticPosition(0, 0);
    setState(() {
      _showJoystick = false;
    });
  }

  void _onPatternSelect(PatternType pattern) {
    _mixer.setPattern(pattern);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _resetHideTimer,
        child: Stack(
          children: [
            // Background
            BackgroundCanvas(
              hue: 270,
              energy: _analyzer.current.energy,
            ),

            // Character canvas
            DKGCanvas(
              dkg: widget.dkg,
              state: _mixer.state,
            ),

            // Touch zones (always active)
            TouchZone(
              onModeChange: _onModeChange,
              onTouchMove: _onTouchMove,
              onTouchEnd: _onTouchEnd,
              currentMode: _mixer.state.mode,
            ),

            // Pattern joystick (shows during PATTERN mode touch)
            if (_showJoystick && _mixer.state.mode == EngineMode.pattern)
              PatternJoystick(
                onPatternSelect: _onPatternSelect,
                currentPattern: _mixer.state.pattern,
                visible: _showJoystick,
                position: _joystickPosition,
              ),

            // Top bar
            if (_showControls) _buildTopBar(),

            // Bottom controls
            if (_showControls) _buildBottomControls(),

            // Pattern indicator
            Positioned(
              top: 80,
              left: 0,
              right: 0,
              child: Center(
                child: AnimatedOpacity(
                  opacity: _showControls ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: _buildPatternIndicator(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          right: 16,
          bottom: 8,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Row(
          children: [
            IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    widget.dkg.meta.name,
                    style: const TextStyle(
                      fontFamily: 'Rajdhani',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '${widget.dkg.manifest.frames.length} frames',
                    style: TextStyle(
                      fontFamily: 'Rajdhani',
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: () {
                // TODO: Show settings
              },
              icon: const Icon(Icons.settings, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + 16,
          left: 16,
          right: 16,
          top: 16,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // BPM display
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Text(
                        _analyzer.estimatedBpm > 0
                            ? '${_analyzer.estimatedBpm.toInt()}'
                            : '---',
                        style: const TextStyle(
                          fontFamily: 'Rajdhani',
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF00FFFF),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        'BPM',
                        style: TextStyle(
                          fontFamily: 'Rajdhani',
                          fontSize: 12,
                          color: Colors.white54,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Audio source buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildAudioButton(
                  icon: Icons.music_note,
                  label: 'FILE',
                  isActive: _audioSource == 'file',
                  onTap: _pickAudioFile,
                ),
                const SizedBox(width: 12),
                _buildAudioButton(
                  icon: Icons.mic,
                  label: 'MIC',
                  isActive: _audioSource == 'mic',
                  onTap: _toggleMicrophone,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Play/pause button
            GestureDetector(
              onTap: () {
                if (_isPlaying) {
                  _audioPlayer.pause();
                } else {
                  _audioPlayer.play();
                }
              },
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF8B5CF6),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF8B5CF6).withOpacity(0.5),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Icon(
                  _isPlaying ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                  size: 32,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioButton({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(0xFF8B5CF6).withOpacity(0.3)
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive
                ? const Color(0xFF8B5CF6)
                : Colors.white.withOpacity(0.2),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? const Color(0xFF8B5CF6) : Colors.white54,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Rajdhani',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive ? const Color(0xFF8B5CF6) : Colors.white54,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPatternIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: _mixer.state.mode == EngineMode.pattern
              ? const Color(0xFF00FFFF).withOpacity(0.3)
              : const Color(0xFFFF00FF).withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _mixer.state.mode == EngineMode.pattern
                  ? const Color(0xFF00FFFF)
                  : const Color(0xFFFF00FF),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _mixer.state.mode == EngineMode.pattern
                ? _mixer.state.pattern.name.toUpperCase()
                : 'KINETIC',
            style: const TextStyle(
              fontFamily: 'Rajdhani',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              letterSpacing: 2,
            ),
          ),
        ],
      ),
    );
  }
}
