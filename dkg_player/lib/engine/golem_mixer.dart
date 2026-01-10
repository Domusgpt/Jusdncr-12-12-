import 'dart:math';
import '../models/dkg_file.dart';
import '../services/audio_analyzer.dart';

/// Engine modes (which frame is selected)
enum EngineMode { pattern, kinetic }

/// Physics styles (how frames move)
enum PhysicsStyle { legacy, laban }

/// Choreography patterns matching the web player exactly
enum PatternType {
  pingPong,    // PING_PONG - Alternates left/right on beat
  buildDrop,   // BUILD_DROP - Builds energy then drops
  stutter,     // STUTTER - Rapid frame swaps
  vogue,       // VOGUE - Pose-focused, dramatic holds
  flow,        // FLOW - Smooth mid-energy transitions
  chaos,       // CHAOS - Random all-energy mix
  abab,        // ABAB - Alternates 2 frames
  aabb,        // AABB - Pairs of frames
  abac,        // ABAC - Pattern with return to A
  snareRoll,   // SNARE_ROLL - Rapid on snare hits
  groove,      // GROOVE - Mid-energy dance focus
  emote,       // EMOTE - Closeup/face focus
  footwork,    // FOOTWORK - Left/right directional
  impact,      // IMPACT - High-energy impacts
  minimal,     // MINIMAL - Low-energy, ambient
}

/// Sequence modes for automatic progression
enum SequenceMode { groove, emote, impact, footwork }

/// Trigger pad states
class TriggerState {
  bool stutter = false;
  bool reverse = false;
  bool glitch = false;
  bool burst = false;
}

/// LABAN effort factors (calculated from audio)
class LabanEffort {
  double weight = 0.5;  // Bass = strong/light
  double space = 0.5;   // High freq = direct/indirect
  double time = 0.5;    // Volatility = sudden/sustained
  double flow = 0.5;    // Mid stability = bound/free
}

/// Physics state for frame rendering
class PhysicsState {
  double x = 0;           // X offset (-1 to 1)
  double y = 0;           // Y offset (-1 to 1)
  double scale = 1;       // Scale factor
  double rotation = 0;    // Rotation in radians
  double squash = 1;      // Vertical squash (0-1 = squashed, 1 = normal)
  double stretch = 1;     // Horizontal stretch
  double alpha = 1;       // Opacity 0-1
  double hueShift = 0;    // Hue rotation 0-360
  double saturation = 1;  // Saturation multiplier
  double brightness = 1;  // Brightness multiplier
  double skew = 0;        // Horizontal skew
  double tilt = 0;        // Z-rotation tilt
  double bounceY = 0;     // Vertical bounce offset
  double flashIntensity = 0; // Flash overlay

  PhysicsState();

  PhysicsState copy() {
    final p = PhysicsState();
    p.x = x; p.y = y; p.scale = scale; p.rotation = rotation;
    p.squash = squash; p.stretch = stretch; p.alpha = alpha;
    p.hueShift = hueShift; p.saturation = saturation; p.brightness = brightness;
    p.skew = skew; p.tilt = tilt; p.bounceY = bounceY; p.flashIntensity = flashIntensity;
    return p;
  }

  void reset() {
    x = 0; y = 0; scale = 1; rotation = 0;
    squash = 1; stretch = 1; alpha = 1;
    hueShift = 0; saturation = 1; brightness = 1;
    skew = 0; tilt = 0; bounceY = 0; flashIntensity = 0;
  }
}

/// Engine state for the mixer
class EngineState {
  FrameData? currentFrame;
  FrameData? sourceFrame;
  PhysicsState physics = PhysicsState();
  PatternType pattern = PatternType.pingPong;
  EngineMode mode = EngineMode.pattern;
  PhysicsStyle physicsStyle = PhysicsStyle.legacy;
  SequenceMode sequenceMode = SequenceMode.groove;

  double time = 0;
  double beatPhase = 0;   // 0-1 phase within current beat
  int beatCount = 0;
  int beatInBar = 0;      // 0-15 (16 beats per bar)
  int barCount = 0;
  bool leftRight = false; // Ping-pong state (left/right)
  String direction = 'center'; // Current direction: left, right, center

  // Kinetic mode axes
  double kineticX = 0;
  double kineticY = 0;

  // Transition state
  double transitionProgress = 1.0;
  double transitionSpeed = 10.0;
  String transitionMode = 'CUT'; // CUT, MORPH, SLIDE, ZOOM_IN, SMOOTH

  // LABAN effort
  LabanEffort labanEffort = LabanEffort();

  // Triggers
  TriggerState triggers = TriggerState();

  // Settings
  double energyMultiplier = 1.0;
  double stutterChance = 0.3;
  bool dynamicCam = true;
  bool shuffleMode = false;
}

/// The GolemMixer engine - matches web playerExport.ts choreography
class GolemMixer {
  final DKGFile dkg;
  final Random _random = Random();

  EngineState state = EngineState();

  // Energy history for trend analysis
  final List<double> _energyHistory = List.filled(30, 0.0);
  int _energyIndex = 0;

  // Frame timing
  double _lastBeatTime = 0;
  double _beatInterval = 500; // ms between beats (120 BPM default)
  double _closeupLockTime = 0;

  // Pattern shuffle interval
  int _shuffleCounter = 0;

  GolemMixer(this.dkg) {
    if (dkg.manifest.frames.isNotEmpty) {
      state.currentFrame = dkg.manifest.frames[0];
      state.sourceFrame = state.currentFrame;
    }
  }

  /// Update the engine with audio analysis
  void update(AudioAnalysis audio, double deltaTime) {
    state.time += deltaTime;
    final now = state.time * 1000; // Convert to ms for compatibility

    // Update BPM tracking
    if (audio.bpm > 0) {
      _beatInterval = 60000 / audio.bpm;
    }

    // Calculate beat phase
    final beatDuration = _beatInterval / 1000;
    state.beatPhase = (state.time % beatDuration) / beatDuration;

    // Update energy history for trend
    _energyHistory[_energyIndex] = audio.energy;
    _energyIndex = (_energyIndex + 1) % _energyHistory.length;

    // Calculate LABAN effort from audio
    if (state.physicsStyle == PhysicsStyle.laban) {
      _updateLabanEffort(audio);
    }

    // Handle beats
    if (audio.isBeat) {
      _onBeat(audio, now);
    }

    // Update physics based on style and mode
    _updatePhysics(audio, deltaTime, now);

    // Handle triggers
    _processTriggers(audio);

    // Decay effects
    _decayEffects(deltaTime);

    // Shuffle mode
    if (state.shuffleMode) {
      _shuffleCounter++;
      if (_shuffleCounter > 240) { // ~4 seconds at 60fps
        _shuffleCounter = 0;
        state.pattern = PatternType.values[_random.nextInt(PatternType.values.length)];
      }
    }
  }

  void _updateLabanEffort(AudioAnalysis audio) {
    final avgEnergy = _energyHistory.reduce((a, b) => a + b) / _energyHistory.length;
    final energyTrend = audio.energy - avgEnergy;

    // Weight: bass = strong, low bass = light
    state.labanEffort.weight = audio.bass;
    // Space: high freq = direct, low = indirect
    state.labanEffort.space = audio.high;
    // Time: energy volatility = sudden, stable = sustained
    state.labanEffort.time = (energyTrend.abs() * 5).clamp(0.0, 1.0);
    // Flow: mid stability = bound, variable = free
    state.labanEffort.flow = 1 - audio.mid;
  }

  void _onBeat(AudioAnalysis audio, double now) {
    state.beatCount++;
    state.leftRight = !state.leftRight;
    _lastBeatTime = now;

    // Bar tracking
    state.beatInBar = (state.beatInBar + 1) % 16;
    if (state.beatInBar == 0) state.barCount++;

    // Determine phase in 16-beat bar
    final beat = state.beatInBar;
    String phase = 'WARMUP';
    if (beat >= 4 && beat < 8) phase = 'SWING_LEFT';
    else if (beat >= 8 && beat < 12) phase = 'SWING_RIGHT';
    else if (beat >= 12) phase = 'DROP';

    // Update direction
    if (phase == 'SWING_LEFT') {
      state.direction = 'left';
    } else if (phase == 'SWING_RIGHT') {
      state.direction = 'right';
    } else {
      state.direction = 'center';
    }

    // Physics on beat
    final p = state.physics;
    p.squash = 0.85;
    p.bounceY = -50 * audio.bass;
    p.flashIntensity = 0.8;

    // Select next frame based on pattern
    _selectNextFrame(audio, phase);
  }

  void _selectNextFrame(AudioAnalysis audio, String phase) {
    final isCloseupLocked = state.time * 1000 < _closeupLockTime;

    // Get pool based on pattern
    List<FrameData> pool = [];
    final pattern = state.pattern;

    if (isCloseupLocked) {
      pool = dkg.closeups;
    } else {
      switch (pattern) {
        case PatternType.emote:
          pool = dkg.closeups.isNotEmpty ? dkg.closeups : dkg.midFrames;
          break;
        case PatternType.chaos:
          pool = [...dkg.lowFrames, ...dkg.midFrames, ...dkg.highFrames];
          break;
        case PatternType.minimal:
          pool = dkg.lowFrames;
          break;
        case PatternType.impact:
        case PatternType.buildDrop:
          pool = dkg.highFrames;
          break;
        case PatternType.groove:
        case PatternType.flow:
          pool = dkg.midFrames;
          break;
        case PatternType.footwork:
          pool = dkg.midFrames.where((f) =>
            f.direction == MoveDirection.left || f.direction == MoveDirection.right
          ).toList();
          break;
        case PatternType.pingPong:
        case PatternType.abab:
        case PatternType.aabb:
        case PatternType.abac:
        default:
          // Energy-based selection
          final avgEnergy = _energyHistory.reduce((a, b) => a + b) / _energyHistory.length;
          final energyTrend = audio.energy - avgEnergy;

          if (energyTrend > 0.1 * state.energyMultiplier) {
            pool = dkg.highFrames;
          } else if (phase == 'WARMUP') {
            pool = dkg.lowFrames;
          } else if (phase == 'SWING_LEFT') {
            pool = dkg.midFrames.where((f) => f.direction == MoveDirection.left).toList();
          } else if (phase == 'SWING_RIGHT') {
            pool = dkg.midFrames.where((f) => f.direction == MoveDirection.right).toList();
          } else if (phase == 'DROP') {
            pool = dkg.highFrames;
          } else {
            pool = dkg.midFrames;
          }
      }
    }

    // Fallback
    if (pool.isEmpty) pool = dkg.midFrames;
    if (pool.isEmpty) pool = dkg.lowFrames;
    if (pool.isEmpty) pool = dkg.manifest.frames;

    if (pool.isNotEmpty) {
      // Pattern-specific frame selection
      FrameData? next;

      switch (pattern) {
        case PatternType.abab:
          // Alternate between 2 frames
          next = state.leftRight ? pool.first : pool.last;
          break;
        case PatternType.aabb:
          // Pairs: same frame for 2 beats
          if (state.beatCount % 2 == 0) {
            next = pool[_random.nextInt(pool.length)];
          }
          break;
        case PatternType.stutter:
        case PatternType.snareRoll:
          // More random, more often
          if (_random.nextDouble() < 0.7) {
            next = pool[_random.nextInt(pool.length)];
          }
          break;
        default:
          next = pool[_random.nextInt(pool.length)];
      }

      if (next != null && next != state.currentFrame) {
        _triggerTransition(next, isCloseupLocked ? 'ZOOM_IN' : 'CUT');
      }
    }

    // Vocal gate: trigger closeup on high mids
    if (!isCloseupLocked && audio.high > 0.6 && audio.mid > 0.4 && audio.bass < 0.5) {
      if (dkg.closeups.isNotEmpty && _random.nextDouble() < 0.5) {
        final next = dkg.closeups[_random.nextInt(dkg.closeups.length)];
        _triggerTransition(next, 'ZOOM_IN');
        _closeupLockTime = state.time * 1000 + 2500;
      }
    }
  }

  void _triggerTransition(FrameData newFrame, String mode) {
    state.sourceFrame = state.currentFrame;
    state.currentFrame = newFrame;
    state.transitionProgress = 0.0;
    state.transitionMode = mode;

    switch (mode) {
      case 'CUT':
        state.transitionSpeed = 1000.0;
        break;
      case 'MORPH':
        state.transitionSpeed = 5.0;
        break;
      case 'SLIDE':
        state.transitionSpeed = 8.0;
        break;
      case 'ZOOM_IN':
        state.transitionSpeed = 6.0;
        break;
      case 'SMOOTH':
        state.transitionSpeed = 1.5;
        break;
      default:
        state.transitionSpeed = 10.0;
    }
  }

  void _updatePhysics(AudioAnalysis audio, double deltaTime, double now) {
    final p = state.physics;

    if (state.mode == EngineMode.kinetic) {
      _updateKinetic(audio);
      return;
    }

    // Get physics parameters based on style
    double stiffness = 140;
    double damping = 8;
    double rotScale = 1.0;
    double squashMod = 1.0;
    double bounceMod = 1.0;

    if (state.physicsStyle == PhysicsStyle.laban) {
      final e = state.labanEffort;
      rotScale = 0.5 + e.space * 1.5;
      squashMod = 0.5 + e.weight * 1.0;
      bounceMod = 0.5 + e.time * 1.5;
      stiffness = 100 + e.flow * 80;
      damping = 5 + (1 - e.flow) * 6;
    }

    // Calculate target rotation from audio
    final tRotX = audio.bass * 35.0 * rotScale;
    final tRotY = audio.mid * 25.0 * sin(now * 0.005) * rotScale;
    final tRotZ = audio.high * 15.0 * rotScale;

    // Spring physics for rotation (simplified)
    final rotDamping = exp(-damping * deltaTime);
    p.rotation = p.rotation * rotDamping + (tRotZ * pi / 180) * (1 - rotDamping);
    p.tilt = p.tilt * rotDamping + (tRotX * pi / 180) * (1 - rotDamping);

    // Apply LABAN squash/bounce modifiers
    if (state.physicsStyle == PhysicsStyle.laban) {
      p.squash = 1 - (state.labanEffort.weight * 0.3 * squashMod);
      p.bounceY = -state.labanEffort.time * 60 * bounceMod * audio.bass;
    }

    // Audio-reactive brightness/saturation
    p.brightness = 1 + audio.high * 0.2;
    p.saturation = 1 + audio.mid * 0.1;
  }

  void _updateKinetic(AudioAnalysis audio) {
    final p = state.physics;

    // Direct mapping from touch/joystick
    p.x = state.kineticX * 0.3;
    p.y = state.kineticY * 0.3;
    p.scale = 1 + state.kineticY * -0.2;
    p.rotation = state.kineticX * 0.2;

    // Audio still affects brightness
    p.brightness = 1 + audio.energy * 0.3;
  }

  void _processTriggers(AudioAnalysis audio) {
    final p = state.physics;
    final t = state.triggers;

    // Stutter trigger: force frame swaps
    if (t.stutter && _random.nextDouble() < 0.35) {
      // Swap source and target (reverse)
      final swap = state.currentFrame;
      state.currentFrame = state.sourceFrame;
      state.sourceFrame = swap;
      p.skew = (_random.nextDouble() - 0.5) * 2.0;
      p.rotation += (_random.nextDouble() - 0.5) * 0.17;
    }

    // Reverse trigger: swap poses
    if (t.reverse && _random.nextDouble() < 0.15) {
      final swap = state.currentFrame;
      state.currentFrame = state.sourceFrame;
      state.sourceFrame = swap;
    }

    // Glitch trigger
    if (t.glitch) {
      if (_random.nextDouble() < 0.3) {
        p.x = (_random.nextDouble() - 0.5) * 0.2;
        p.hueShift = _random.nextDouble() * 60;
      }
    }

    // Burst trigger
    if (t.burst) {
      p.flashIntensity = max(p.flashIntensity, 0.8);
      p.scale = max(p.scale, 1.3);
    }
  }

  void _decayEffects(double deltaTime) {
    final p = state.physics;

    // Decay squash back to 1
    p.squash += (1.0 - p.squash) * (12 * deltaTime);
    // Decay skew back to 0
    p.skew += (0.0 - p.skew) * (10 * deltaTime);
    // Decay bounceY back to 0
    p.bounceY += (0 - p.bounceY) * (10 * deltaTime);
    // Decay flash intensity
    p.flashIntensity *= exp(-15 * deltaTime);

    // Update transition progress
    if (state.transitionProgress < 1.0) {
      state.transitionProgress += state.transitionSpeed * deltaTime;
      if (state.transitionProgress > 1.0) state.transitionProgress = 1.0;
    }
  }

  // Public API

  void setMode(EngineMode mode) => state.mode = mode;
  void setPhysicsStyle(PhysicsStyle style) => state.physicsStyle = style;
  void setPattern(PatternType pattern) => state.pattern = pattern;
  void setSequenceMode(SequenceMode mode) => state.sequenceMode = mode;

  void setKineticPosition(double x, double y) {
    state.kineticX = x.clamp(-1.0, 1.0);
    state.kineticY = y.clamp(-1.0, 1.0);
  }

  void setTrigger(String name, bool active) {
    switch (name) {
      case 'stutter': state.triggers.stutter = active; break;
      case 'reverse': state.triggers.reverse = active; break;
      case 'glitch': state.triggers.glitch = active; break;
      case 'burst': state.triggers.burst = active; break;
    }
  }

  void toggleShuffle() => state.shuffleMode = !state.shuffleMode;
  void toggleDynamicCam() => state.dynamicCam = !state.dynamicCam;

  void setEnergyMultiplier(double value) => state.energyMultiplier = value;
  void setStutterChance(double value) => state.stutterChance = value;

  /// Get pattern by index (0-14)
  static PatternType getPatternByIndex(int index) {
    if (index < 0 || index >= PatternType.values.length) {
      return PatternType.pingPong;
    }
    return PatternType.values[index];
  }

  /// Get all pattern display names
  static List<String> get patternNames => [
    'PING PONG', 'BUILD DROP', 'STUTTER', 'VOGUE', 'FLOW',
    'CHAOS', 'ABAB', 'AABB', 'ABAC', 'SNARE ROLL',
    'GROOVE', 'EMOTE', 'FOOTWORK', 'IMPACT', 'MINIMAL',
  ];

  /// Get pattern key codes (for keyboard)
  static const patternKeyMap = {
    '1': PatternType.pingPong,
    '2': PatternType.buildDrop,
    '3': PatternType.stutter,
    '4': PatternType.vogue,
    '5': PatternType.flow,
    '6': PatternType.chaos,
    '7': PatternType.abab,
    '8': PatternType.aabb,
    '9': PatternType.abac,
    '0': PatternType.snareRoll,
  };
}
