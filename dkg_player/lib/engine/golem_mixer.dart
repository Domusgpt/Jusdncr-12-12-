import 'dart:math';
import '../models/dkg_file.dart';
import '../services/audio_analyzer.dart';

/// Engine modes
enum EngineMode { pattern, kinetic }

/// Pattern types matching the web player
enum PatternType {
  idle,
  pulse,
  bounce,
  wave,
  zigzag,
  spiral,
  shake,
  strobe,
  glitch,
  melt,
  explode,
  implode,
  rotate,
  split,
  mirror,
}

/// Physics state for frame rendering
class PhysicsState {
  double x;           // X offset (-1 to 1)
  double y;           // Y offset (-1 to 1)
  double scale;       // Scale factor
  double rotation;    // Rotation in radians
  double squash;      // Vertical squash (0-1 = squashed, 1 = normal)
  double stretch;     // Horizontal stretch
  double alpha;       // Opacity 0-1
  double hueShift;    // Hue rotation 0-360
  double saturation;  // Saturation multiplier
  double brightness;  // Brightness multiplier

  PhysicsState({
    this.x = 0,
    this.y = 0,
    this.scale = 1,
    this.rotation = 0,
    this.squash = 1,
    this.stretch = 1,
    this.alpha = 1,
    this.hueShift = 0,
    this.saturation = 1,
    this.brightness = 1,
  });

  PhysicsState copy() => PhysicsState(
    x: x, y: y, scale: scale, rotation: rotation,
    squash: squash, stretch: stretch, alpha: alpha,
    hueShift: hueShift, saturation: saturation, brightness: brightness,
  );

  /// Lerp between two states
  static PhysicsState lerp(PhysicsState a, PhysicsState b, double t) {
    return PhysicsState(
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      scale: a.scale + (b.scale - a.scale) * t,
      rotation: a.rotation + (b.rotation - a.rotation) * t,
      squash: a.squash + (b.squash - a.squash) * t,
      stretch: a.stretch + (b.stretch - a.stretch) * t,
      alpha: a.alpha + (b.alpha - a.alpha) * t,
      hueShift: a.hueShift + (b.hueShift - a.hueShift) * t,
      saturation: a.saturation + (b.saturation - a.saturation) * t,
      brightness: a.brightness + (b.brightness - a.brightness) * t,
    );
  }
}

/// Engine state for the mixer
class EngineState {
  FrameData? currentFrame;
  PhysicsState physics;
  PatternType pattern;
  EngineMode mode;
  double time;
  double beatPhase;   // 0-1 phase within current beat
  int beatCount;
  bool leftRight;     // Ping-pong state
  double kineticX;    // Kinetic mode X axis (-1 to 1)
  double kineticY;    // Kinetic mode Y axis (-1 to 1)

  EngineState({
    this.currentFrame,
    PhysicsState? physics,
    this.pattern = PatternType.pulse,
    this.mode = EngineMode.pattern,
    this.time = 0,
    this.beatPhase = 0,
    this.beatCount = 0,
    this.leftRight = false,
    this.kineticX = 0,
    this.kineticY = 0,
  }) : physics = physics ?? PhysicsState();
}

/// The GolemMixer engine - ported from TypeScript
class GolemMixer {
  final DKGFile dkg;
  final Random _random = Random();

  EngineState state = EngineState();

  // Pattern parameters
  double patternIntensity = 0.5;
  double reactivity = 0.7;

  // Frame timing
  double _lastBeatTime = 0;
  double _beatInterval = 500; // ms between beats (120 BPM default)

  GolemMixer(this.dkg) {
    // Initialize with first frame
    if (dkg.manifest.frames.isNotEmpty) {
      state.currentFrame = dkg.manifest.frames[0];
    }
  }

  /// Update the engine with audio analysis
  void update(AudioAnalysis audio, double deltaTime) {
    state.time += deltaTime;

    // Update BPM tracking
    if (audio.bpm > 0) {
      _beatInterval = 60000 / audio.bpm;
    }

    // Calculate beat phase
    final beatDuration = _beatInterval / 1000;
    state.beatPhase = (state.time % beatDuration) / beatDuration;

    // Handle beats
    if (audio.isBeat) {
      _onBeat(audio);
    }

    // Update physics based on mode
    if (state.mode == EngineMode.pattern) {
      _updatePattern(audio, deltaTime);
    } else {
      _updateKinetic(audio, deltaTime);
    }
  }

  void _onBeat(AudioAnalysis audio) {
    state.beatCount++;
    state.leftRight = !state.leftRight;
    _lastBeatTime = state.time;

    // Maybe switch frames on beat
    if (_random.nextDouble() < 0.3 + audio.energy * 0.5) {
      _selectNextFrame(audio);
    }
  }

  void _selectNextFrame(AudioAnalysis audio) {
    // Determine energy level
    EnergyLevel targetEnergy;
    if (audio.energy > 0.7) {
      targetEnergy = EnergyLevel.high;
    } else if (audio.energy > 0.3) {
      targetEnergy = EnergyLevel.mid;
    } else {
      targetEnergy = EnergyLevel.low;
    }

    // Get appropriate pool
    List<FrameData> pool = dkg.getFramesByEnergy(targetEnergy);
    if (pool.isEmpty) pool = dkg.manifest.frames;

    // Filter by direction for ping-pong
    if (state.leftRight && dkg.leftFrames.isNotEmpty) {
      final leftPool = pool.where((f) => f.direction == MoveDirection.left).toList();
      if (leftPool.isNotEmpty) pool = leftPool;
    } else if (!state.leftRight && dkg.rightFrames.isNotEmpty) {
      final rightPool = pool.where((f) => f.direction == MoveDirection.right).toList();
      if (rightPool.isNotEmpty) pool = rightPool;
    }

    // Pick random from pool
    if (pool.isNotEmpty) {
      state.currentFrame = pool[_random.nextInt(pool.length)];
    }
  }

  void _updatePattern(AudioAnalysis audio, double deltaTime) {
    final p = state.physics;
    final t = state.time;
    final phase = state.beatPhase;
    final intensity = patternIntensity * reactivity;
    final bass = audio.bass * intensity;
    final energy = audio.energy * intensity;

    // Reset base values
    p.x = 0;
    p.y = 0;
    p.scale = 1;
    p.rotation = 0;
    p.squash = 1;
    p.stretch = 1;

    switch (state.pattern) {
      case PatternType.idle:
        // Gentle breathing
        p.scale = 1 + sin(t * 2) * 0.02;
        break;

      case PatternType.pulse:
        // Scale on beat
        p.scale = 1 + bass * 0.3;
        p.squash = 1 - bass * 0.1;
        break;

      case PatternType.bounce:
        // Vertical bounce
        p.y = -sin(phase * pi * 2) * bass * 0.2;
        p.squash = 1 - cos(phase * pi * 2) * bass * 0.15;
        break;

      case PatternType.wave:
        // Side to side wave
        p.x = sin(t * 3) * energy * 0.15;
        p.rotation = sin(t * 3) * energy * 0.1;
        break;

      case PatternType.zigzag:
        // Sharp left-right on beat
        p.x = (state.leftRight ? 1 : -1) * bass * 0.2;
        break;

      case PatternType.spiral:
        // Rotation with scale
        p.rotation = t * 0.5 + bass * 0.5;
        p.scale = 1 + sin(t * 4) * energy * 0.1;
        break;

      case PatternType.shake:
        // Random shake
        p.x = (_random.nextDouble() - 0.5) * energy * 0.1;
        p.y = (_random.nextDouble() - 0.5) * energy * 0.1;
        p.rotation = (_random.nextDouble() - 0.5) * energy * 0.05;
        break;

      case PatternType.strobe:
        // Flash on beat
        p.brightness = audio.isBeat ? 2.0 : 1.0;
        p.scale = audio.isBeat ? 1.1 : 1.0;
        break;

      case PatternType.glitch:
        // Glitchy displacement
        if (_random.nextDouble() < energy * 0.3) {
          p.x = (_random.nextDouble() - 0.5) * 0.2;
          p.hueShift = _random.nextDouble() * 60;
        }
        break;

      case PatternType.melt:
        // Vertical stretch/squash
        p.squash = 1 + sin(t * 2) * energy * 0.3;
        p.stretch = 1 - sin(t * 2) * energy * 0.15;
        break;

      case PatternType.explode:
        // Scale out on beat, return
        final explodePhase = 1 - phase;
        p.scale = 1 + explodePhase * bass * 0.5;
        p.alpha = 1 - explodePhase * bass * 0.3;
        break;

      case PatternType.implode:
        // Scale in on beat, return
        p.scale = 1 - (1 - phase) * bass * 0.3;
        break;

      case PatternType.rotate:
        // Continuous rotation
        p.rotation = t * energy * 2;
        break;

      case PatternType.split:
        // Horizontal split feeling
        p.stretch = 1 + bass * 0.3;
        p.x = sin(t * 4) * energy * 0.1;
        break;

      case PatternType.mirror:
        // Flip on beat
        p.stretch = state.leftRight ? 1 : -1;
        break;
    }

    // Apply audio reactivity overlay
    p.brightness = 1 + audio.high * 0.2;
    p.saturation = 1 + audio.mid * 0.1;
  }

  void _updateKinetic(AudioAnalysis audio, double deltaTime) {
    final p = state.physics;

    // Direct mapping from touch/joystick to position
    p.x = state.kineticX * 0.3;
    p.y = state.kineticY * 0.3;

    // Scale based on Y axis (up = bigger)
    p.scale = 1 + state.kineticY * -0.2;

    // Rotation based on X axis
    p.rotation = state.kineticX * 0.2;

    // Audio still affects brightness
    p.brightness = 1 + audio.energy * 0.3;
  }

  /// Set engine mode
  void setMode(EngineMode mode) {
    state.mode = mode;
  }

  /// Set pattern type
  void setPattern(PatternType pattern) {
    state.pattern = pattern;
  }

  /// Set kinetic position (from touch/joystick)
  void setKineticPosition(double x, double y) {
    state.kineticX = x.clamp(-1.0, 1.0);
    state.kineticY = y.clamp(-1.0, 1.0);
  }

  /// Trigger a burst effect
  void triggerBurst() {
    state.physics.scale = 1.5;
    state.physics.brightness = 2.0;
  }

  /// Trigger a freeze effect
  void triggerFreeze() {
    state.physics.saturation = 0;
    state.physics.brightness = 1.5;
  }

  /// Get pattern by index (0-14)
  static PatternType getPatternByIndex(int index) {
    if (index < 0 || index >= PatternType.values.length) {
      return PatternType.pulse;
    }
    return PatternType.values[index];
  }

  /// Get all pattern names
  static List<String> get patternNames =>
      PatternType.values.map((p) => p.name.toUpperCase()).toList();
}
