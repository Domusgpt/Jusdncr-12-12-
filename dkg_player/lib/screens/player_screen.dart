import 'dart:io';

import 'package:flutter/material.dart';

import '../engine/golem_mixer.dart';
import '../models/atlas.dart';
import '../services/audio/audio_engine.dart';
import '../services/audio/audio_sources.dart';
import '../services/audio/fft_analyzer.dart';
import '../widgets/dkg_canvas.dart';
import '../widgets/pattern_joystick.dart';
import '../widgets/touch_zone.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  final patterns = const [
    'PING_PONG',
    'BUILD_DROP',
    'STUTTER',
    'VOGUE',
    'FLOW',
    'CHAOS',
    'MINIMAL',
    'ABAB',
    'AABB',
    'ABAC',
  ];
  String selectedPattern = 'PING_PONG';
  Offset touchValue = Offset.zero;
  bool micActive = false;

  final AudioEngine _audioEngine = AudioEngine(analyzer: FFTAnalyzer());
  AudioFeatures? _audioFeatures;
  final GolemMixer _mixer = GolemMixer();

  DkgAtlas? _atlas;
  String? _currentFrameName;

  @override
  void initState() {
    super.initState();
    _audioEngine.features.listen((features) {
      setState(() {
        _audioFeatures = features;
      });
      _mixer.update(
        AudioData(
          bass: features.bass,
          mid: features.mid,
          high: features.high,
          energy: features.energy,
          timestamp: features.timestamp,
        ),
      );
    });
  }

  @override
  void dispose() {
    _audioEngine.dispose();
    super.dispose();
  }

  Future<void> _toggleMic() async {
    if (micActive) {
      await _audioEngine.detachSource();
      setState(() {
        micActive = false;
      });
    } else {
      await _audioEngine.attachSource(MicAudioSource());
      setState(() {
        micActive = true;
      });
    }
  }

  Future<void> _loadAudioFile(File file) async {
    await _audioEngine.attachSource(FileAudioSource(file));
    setState(() {
      micActive = false;
    });
  }

  void _updatePattern(String pattern) {
    setState(() {
      selectedPattern = pattern;
    });
  }

  @override
  Widget build(BuildContext context) {
    final telemetry = _mixer.getTelemetry();
    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: DKGCanvas(
                atlas: _atlas,
                frameName: _currentFrameName,
                zoom: 1.1,
                mirror: telemetry.engineMode == EngineMode.pattern,
              ),
            ),
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _StatusChip(
                    label: 'BPM',
                    value: telemetry.bpm.toStringAsFixed(0),
                  ),
                  _StatusChip(
                    label: 'ENERGY',
                    value: _audioFeatures?.energy.toStringAsFixed(2) ?? '0.00',
                  ),
                  IconButton(
                    onPressed: _toggleMic,
                    icon: Icon(
                      micActive ? Icons.mic : Icons.mic_none,
                      color: micActive ? Colors.redAccent : Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              bottom: 32,
              left: 24,
              child: TouchZone(
                label: 'TOUCH ZONE',
                onChanged: (value) {
                  setState(() {
                    touchValue = value;
                  });
                },
              ),
            ),
            Positioned(
              bottom: 32,
              right: 24,
              child: SizedBox(
                width: 260,
                child: PatternJoystick(
                  patterns: patterns,
                  selected: selectedPattern,
                  onSelected: _updatePattern,
                ),
              ),
            ),
            Positioned(
              left: 24,
              bottom: 200,
              child: _StatusPanel(
                touchValue: touchValue,
                sequence: telemetry.sequenceMode.name.toUpperCase(),
                mode: telemetry.engineMode.name.toUpperCase(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Colors.white54),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel({
    required this.touchValue,
    required this.sequence,
    required this.mode,
  });

  final Offset touchValue;
  final String sequence;
  final String mode;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'LIVE FEEDBACK',
            style: TextStyle(
              fontSize: 10,
              color: Colors.white54,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'MODE: $mode',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          Text(
            'SEQUENCE: $sequence',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 8),
          Text(
            'TOUCH: ${touchValue.dx.toStringAsFixed(2)}, ${touchValue.dy.toStringAsFixed(2)}',
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
