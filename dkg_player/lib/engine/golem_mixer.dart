import 'dart:math';

import '../models/generated_frame.dart';
import '../models/dkg_project.dart';

enum MixMode { sequencer, layer, off }

enum SequenceMode { groove, emote, impact, footwork }

enum PatternType {
  pingPong,
  buildDrop,
  stutter,
  vogue,
  flow,
  chaos,
  minimal,
  abab,
  aabb,
  abac,
  snareRoll,
  groove,
  emote,
  footwork,
  impact,
}

enum EngineMode { pattern, kinetic }

enum TransitionMode { cut, slide, morph, smooth, zoomIn }

enum BodyPart { full, upper, lower, hands, face }

class Vector3 {
  Vector3({required this.x, required this.y, required this.z});

  double x;
  double y;
  double z;

  Vector3 copy() => Vector3(x: x, y: y, z: z);
}

class Vector2 {
  Vector2({required this.x, required this.y});

  double x;
  double y;

  Vector2 copy() => Vector2(x: x, y: y);
}

class AudioData {
  AudioData({
    required this.bass,
    required this.mid,
    required this.high,
    required this.energy,
    required this.timestamp,
  });

  final double bass;
  final double mid;
  final double high;
  final double energy;
  final int timestamp;
}

class DeckFrame extends GeneratedFrame {
  DeckFrame({
    required super.url,
    required super.pose,
    super.energy = EnergyLevel.mid,
    super.type,
    super.role,
    super.direction,
    super.promptUsed,
    required this.deckId,
    this.bodyPart,
  });

  final int deckId;
  final BodyPart? bodyPart;

  factory DeckFrame.fromGenerated(GeneratedFrame frame, int deckId) {
    return DeckFrame(
      url: frame.url,
      pose: frame.pose,
      energy: frame.energy,
      type: frame.type,
      role: frame.role,
      direction: frame.direction,
      promptUsed: frame.promptUsed,
      deckId: deckId,
    );
  }

  DeckFrame copyWith({
    int? deckId,
    String? url,
    String? pose,
    EnergyLevel? energy,
    FrameType? type,
    SheetRole? role,
    MoveDirection? direction,
    String? promptUsed,
    BodyPart? bodyPart,
  }) {
    return DeckFrame(
      url: url ?? this.url,
      pose: pose ?? this.pose,
      energy: energy ?? this.energy,
      type: type ?? this.type,
      role: role ?? this.role,
      direction: direction ?? this.direction,
      promptUsed: promptUsed ?? this.promptUsed,
      deckId: deckId ?? this.deckId,
      bodyPart: bodyPart ?? this.bodyPart,
    );
  }
}

class GolemDeck {
  GolemDeck({
    required this.id,
    required this.name,
    required this.rig,
    required this.isActive,
    required this.mixMode,
    required this.opacity,
    required this.volume,
    required this.allFrames,
    required this.framesByEnergy,
    required this.closeups,
    required this.hands,
    required this.feet,
    required this.mandalas,
    required this.virtuals,
    required this.acrobatics,
    required this.leftFrames,
    required this.rightFrames,
  });

  final int id;
  final String name;
  DkgProject? rig;
  bool isActive;
  MixMode mixMode;
  double opacity;
  double volume;
  List<DeckFrame> allFrames;
  Map<EnergyLevel, List<DeckFrame>> framesByEnergy;
  List<DeckFrame> closeups;
  List<DeckFrame> hands;
  List<DeckFrame> feet;
  List<DeckFrame> mandalas;
  List<DeckFrame> virtuals;
  List<DeckFrame> acrobatics;
  List<DeckFrame> leftFrames;
  List<DeckFrame> rightFrames;
}

class KineticState {
  KineticState({
    required this.currentNode,
    required this.previousNode,
    required this.beatPos,
    required this.barCounter,
    required this.phraseCounter,
    required this.bpm,
    required this.isLocked,
    required this.lockReleaseTime,
    required this.sequenceMode,
  });

  String currentNode;
  String previousNode;
  double beatPos;
  int barCounter;
  int phraseCounter;
  double bpm;
  bool isLocked;
  int lockReleaseTime;
  SequenceMode sequenceMode;
}

class PhysicsState {
  PhysicsState({
    required this.rotation,
    required this.velocity,
    required this.squash,
    required this.bounce,
    required this.tilt,
    required this.zoom,
    required this.pan,
  });

  Vector3 rotation;
  Vector3 velocity;
  double squash;
  double bounce;
  double tilt;
  double zoom;
  Vector2 pan;

  PhysicsState copy() {
    return PhysicsState(
      rotation: rotation.copy(),
      velocity: velocity.copy(),
      squash: squash,
      bounce: bounce,
      tilt: tilt,
      zoom: zoom,
      pan: pan.copy(),
    );
  }
}

class EffectsState {
  EffectsState({
    required this.rgbSplit,
    required this.flash,
    required this.glitch,
    required this.scanlines,
    required this.hueShift,
    required this.aberration,
    required this.invert,
    required this.grayscale,
    required this.mirror,
    required this.strobe,
  });

  double rgbSplit;
  double flash;
  double glitch;
  double scanlines;
  double hueShift;
  double aberration;
  bool invert;
  bool grayscale;
  bool mirror;
  bool strobe;

  EffectsState copy() {
    return EffectsState(
      rgbSplit: rgbSplit,
      flash: flash,
      glitch: glitch,
      scanlines: scanlines,
      hueShift: hueShift,
      aberration: aberration,
      invert: invert,
      grayscale: grayscale,
      mirror: mirror,
      strobe: strobe,
    );
  }
}

class MixerLayeredFrame {
  MixerLayeredFrame({
    required this.frame,
    required this.deckId,
    required this.opacity,
    required this.blendMode,
  });

  final DeckFrame frame;
  final int deckId;
  final double opacity;
  final String blendMode;
}

class MixerOutput {
  MixerOutput({
    required this.frame,
    required this.deckId,
    required this.transitionMode,
    required this.transitionSpeed,
    required this.physics,
    required this.effects,
    required this.sequenceMode,
    required this.isTransitioning,
    required this.didSelectFrame,
    required this.layeredFrames,
    required this.crossfaderPosition,
  });

  final DeckFrame? frame;
  final int deckId;
  final TransitionMode transitionMode;
  final double transitionSpeed;
  final PhysicsState physics;
  final EffectsState effects;
  final SequenceMode sequenceMode;
  final bool isTransitioning;
  final bool didSelectFrame;
  final List<MixerLayeredFrame> layeredFrames;
  final double crossfaderPosition;
}

class MixerTelemetry {
  MixerTelemetry({
    required this.fps,
    required this.bpm,
    required this.bpmConfidence,
    required this.barCounter,
    required this.phraseCounter,
    required this.beatPos,
    required this.sequenceMode,
    required this.engineMode,
    required this.activePattern,
    required this.currentNode,
    required this.activeDecks,
    required this.poolCounts,
  });

  final int fps;
  final double bpm;
  final double bpmConfidence;
  final int barCounter;
  final int phraseCounter;
  final double beatPos;
  final SequenceMode sequenceMode;
  final EngineMode engineMode;
  final PatternType activePattern;
  final String currentNode;
  final List<int> activeDecks;
  final Map<String, int> poolCounts;
}

class BpmResult {
  BpmResult({required this.bpm, required this.confidence});

  final double bpm;
  final double confidence;
}

class BPMDetector {
  final List<double> _energyHistory = [];
  final List<int> _beatTimes = [];
  int _lastBeatTime = 0;
  final int maxHistory = 30;
  final int minInterval = 250;
  final int maxInterval = 1500;
  double _peakHoldValue = 0;
  final double _peakDecay = 0.95;

  bool detectBeat(double bass, int timestamp) {
    _energyHistory.add(bass);
    if (_energyHistory.length > maxHistory) {
      _energyHistory.removeAt(0);
    }

    _peakHoldValue = max(bass, _peakHoldValue * _peakDecay);
    final avg = _energyHistory.reduce((a, b) => a + b) / _energyHistory.length;
    final dynamicThreshold = min(
      avg * 1.3,
      avg + (_peakHoldValue - avg) * 0.35,
    );
    final minThreshold = _peakHoldValue * 0.4;
    final threshold = max(dynamicThreshold, minThreshold);

    final interval = timestamp - _lastBeatTime;

    if (bass > threshold && interval > minInterval && interval < maxInterval) {
      _lastBeatTime = timestamp;
      _beatTimes.add(timestamp);
      if (_beatTimes.length > 16) {
        _beatTimes.removeAt(0);
      }
      return true;
    }

    return false;
  }

  BpmResult getBPM() {
    if (_beatTimes.length < 2) {
      return BpmResult(bpm: 120, confidence: 0);
    }

    final intervals = <int>[];
    for (var i = 1; i < _beatTimes.length; i++) {
      intervals.add(_beatTimes[i] - _beatTimes[i - 1]);
    }

    intervals.sort();
    final median = intervals[intervals.length ~/ 2];
    final bpm = (60000 / median).round().toDouble();

    final mean = intervals.reduce((a, b) => a + b) / intervals.length;
    final variance = intervals
            .map((value) => pow(value - mean, 2))
            .reduce((a, b) => a + b) /
        intervals.length;
    final cv = sqrt(variance) / mean;
    final confidence = max(0, min(1, 1 - cv * 2));

    return BpmResult(
      bpm: max(60, min(200, bpm)),
      confidence: confidence,
    );
  }

  void reset() {
    _energyHistory.clear();
    _beatTimes.clear();
    _lastBeatTime = 0;
    _peakHoldValue = 0;
  }

  void tapBeat(int timestamp) {
    final interval = timestamp - _lastBeatTime;
    if (interval > minInterval && interval < maxInterval) {
      _lastBeatTime = timestamp;
      _beatTimes.add(timestamp);
      if (_beatTimes.length > 16) {
        _beatTimes.removeAt(0);
      }
    }
  }
}

class KineticNode {
  KineticNode({
    required this.id,
    required this.energyRequired,
    required this.exitThreshold,
    required this.minDuration,
    required this.transitions,
    this.mechanicalFX,
  });

  final String id;
  final double energyRequired;
  final double exitThreshold;
  final int minDuration;
  final List<String> transitions;
  final List<String>? mechanicalFX;
}

final Map<String, KineticNode> kineticGraph = {
  'idle': KineticNode(
    id: 'idle',
    energyRequired: 0,
    exitThreshold: 0,
    minDuration: 0,
    transitions: ['groove_left', 'groove_right', 'groove_center', 'crouch'],
  ),
  'groove_left': KineticNode(
    id: 'groove_left',
    energyRequired: 0.3,
    exitThreshold: 0.2,
    minDuration: 100,
    transitions: ['idle', 'groove_center', 'groove_right', 'vogue_left', 'crouch'],
    mechanicalFX: ['tilt_left'],
  ),
  'groove_right': KineticNode(
    id: 'groove_right',
    energyRequired: 0.3,
    exitThreshold: 0.2,
    minDuration: 100,
    transitions: ['idle', 'groove_center', 'groove_left', 'vogue_right', 'crouch'],
    mechanicalFX: ['tilt_right', 'mirror'],
  ),
  'groove_center': KineticNode(
    id: 'groove_center',
    energyRequired: 0.2,
    exitThreshold: 0.1,
    minDuration: 100,
    transitions: ['groove_left', 'groove_right', 'jump', 'crouch', 'closeup'],
  ),
  'crouch': KineticNode(
    id: 'crouch',
    energyRequired: 0.4,
    exitThreshold: 0.3,
    minDuration: 150,
    transitions: ['jump', 'groove_center', 'idle'],
  ),
  'jump': KineticNode(
    id: 'jump',
    energyRequired: 0.7,
    exitThreshold: 0.5,
    minDuration: 100,
    transitions: ['crouch', 'groove_center', 'impact'],
    mechanicalFX: ['zoom'],
  ),
  'vogue_left': KineticNode(
    id: 'vogue_left',
    energyRequired: 0.5,
    exitThreshold: 0.3,
    minDuration: 200,
    transitions: ['groove_left', 'vogue_right', 'closeup'],
  ),
  'vogue_right': KineticNode(
    id: 'vogue_right',
    energyRequired: 0.5,
    exitThreshold: 0.3,
    minDuration: 200,
    transitions: ['groove_right', 'vogue_left', 'closeup'],
    mechanicalFX: ['mirror'],
  ),
  'closeup': KineticNode(
    id: 'closeup',
    energyRequired: 0.6,
    exitThreshold: 0.4,
    minDuration: 500,
    transitions: ['groove_center', 'idle', 'hands'],
    mechanicalFX: ['zoom'],
  ),
  'hands': KineticNode(
    id: 'hands',
    energyRequired: 0.5,
    exitThreshold: 0.4,
    minDuration: 300,
    transitions: ['closeup', 'mandala', 'groove_center'],
  ),
  'feet': KineticNode(
    id: 'feet',
    energyRequired: 0.4,
    exitThreshold: 0.3,
    minDuration: 200,
    transitions: ['crouch', 'groove_left', 'groove_right'],
  ),
  'mandala': KineticNode(
    id: 'mandala',
    energyRequired: 0.7,
    exitThreshold: 0.5,
    minDuration: 300,
    transitions: ['hands', 'groove_center', 'impact'],
    mechanicalFX: ['mandala'],
  ),
  'impact': KineticNode(
    id: 'impact',
    energyRequired: 0.8,
    exitThreshold: 0.6,
    minDuration: 150,
    transitions: ['jump', 'mandala', 'groove_center'],
    mechanicalFX: ['zoom', 'flash'],
  ),
  'acrobatic': KineticNode(
    id: 'acrobatic',
    energyRequired: 0.9,
    exitThreshold: 0.7,
    minDuration: 400,
    transitions: ['impact', 'jump', 'groove_center'],
    mechanicalFX: ['zoom'],
  ),
};

class GolemMixer {
  final List<GolemDeck> _decks = [];
  EngineMode _engineMode = EngineMode.kinetic;
  PatternType _activePattern = PatternType.pingPong;

  KineticState _kineticState = KineticState(
    currentNode: 'idle',
    previousNode: 'idle',
    beatPos: 0,
    barCounter: 0,
    phraseCounter: 0,
    bpm: 120,
    isLocked: false,
    lockReleaseTime: 0,
    sequenceMode: SequenceMode.groove,
  );

  final BPMDetector _bpmDetector = BPMDetector();
  bool _autoBPM = true;
  double _manualBPM = 120;

  PhysicsState _physics = PhysicsState(
    rotation: Vector3(x: 0, y: 0, z: 0),
    velocity: Vector3(x: 0, y: 0, z: 0),
    squash: 1,
    bounce: 0,
    tilt: 0,
    zoom: 1.15,
    pan: Vector2(x: 0, y: 0),
  );

  EffectsState _effects = EffectsState(
    rgbSplit: 0,
    flash: 0,
    glitch: 0,
    scanlines: 0,
    hueShift: 0,
    aberration: 0,
    invert: false,
    grayscale: false,
    mirror: false,
    strobe: false,
  );

  DeckFrame? _currentFrame;
  DeckFrame? _previousFrame;
  double _transitionProgress = 1.0;
  TransitionMode _transitionMode = TransitionMode.cut;
  double _transitionSpeed = 10.0;

  int _lastBeatTime = 0;
  int _lastUpdateTime = 0;
  double _beatDuration = 500;

  bool _triggerStutter = false;
  bool _triggerReverse = false;
  bool _triggerGlitch = false;
  bool _triggerBurst = false;

  int _patternIndex = 0;
  DeckFrame? _patternFrameA;
  DeckFrame? _patternFrameB;
  DeckFrame? _patternFrameC;

  int _frameCount = 0;
  int _lastFpsTime = 0;
  int _currentFps = 0;

  bool _frameWasSelected = false;
  double _crossfaderPosition = 0;
  final List<int> _deckFrameIndices = [0, 0, 0, 0];
  final Random _random = Random();

  GolemMixer() {
    for (var i = 0; i < 4; i++) {
      _decks.add(_createEmptyDeck(i));
    }
  }

  GolemDeck _createEmptyDeck(int id) {
    return GolemDeck(
      id: id,
      name: 'Deck ${id + 1}',
      rig: null,
      isActive: id == 0,
      mixMode: id == 0 ? MixMode.sequencer : MixMode.off,
      opacity: 1,
      volume: 1,
      allFrames: [],
      framesByEnergy: {
        EnergyLevel.low: [],
        EnergyLevel.mid: [],
        EnergyLevel.high: [],
      },
      closeups: [],
      hands: [],
      feet: [],
      mandalas: [],
      virtuals: [],
      acrobatics: [],
      leftFrames: [],
      rightFrames: [],
    );
  }

  void loadDeck(int deckId, List<GeneratedFrame> frames) {
    if (deckId < 0 || deckId >= 4) return;
    final deck = _decks[deckId];
    deck.allFrames = [];
    deck.framesByEnergy = {
      EnergyLevel.low: [],
      EnergyLevel.mid: [],
      EnergyLevel.high: [],
    };
    deck.closeups = [];
    deck.hands = [];
    deck.feet = [];
    deck.mandalas = [];
    deck.virtuals = [];
    deck.acrobatics = [];
    deck.leftFrames = [];
    deck.rightFrames = [];

    for (final frame in frames) {
      final deckFrame = DeckFrame.fromGenerated(frame, deckId);
      deck.allFrames.add(deckFrame);

      final energy = frame.energy;
      deck.framesByEnergy[energy]?.add(deckFrame);

      final frameType = frame.type ?? FrameType.body;
      if (frameType == FrameType.closeup) {
        deck.closeups.add(deckFrame);
      }
      if (frameType == FrameType.hands) {
        deck.hands.add(deckFrame);
      }
      if (frameType == FrameType.feet) {
        deck.feet.add(deckFrame);
      }
      if (frameType == FrameType.mandala) {
        deck.mandalas.add(deckFrame);
      }
      if (frameType == FrameType.acrobatic) {
        deck.acrobatics.add(deckFrame);
      }

      final dir = frame.direction;
      if (dir == MoveDirection.left) {
        deck.leftFrames.add(deckFrame);
      } else if (dir == MoveDirection.right) {
        deck.rightFrames.add(deckFrame);
      }

      if (energy == EnergyLevel.high && frameType == FrameType.body) {
        deck.virtuals.add(
          deckFrame.copyWith(
            pose: '${frame.pose}_vzoom',
            bodyPart: BodyPart.upper,
          ),
        );
      }
    }

    if (deck.framesByEnergy[EnergyLevel.low]!.isEmpty) {
      deck.framesByEnergy[EnergyLevel.low] = [...deck.allFrames];
    }
    if (deck.framesByEnergy[EnergyLevel.mid]!.isEmpty) {
      deck.framesByEnergy[EnergyLevel.mid] = [...deck.allFrames];
    }
    if (deck.framesByEnergy[EnergyLevel.high]!.isEmpty) {
      deck.framesByEnergy[EnergyLevel.high] = [...deck.allFrames];
    }

    deck.isActive = true;
    deck.mixMode = MixMode.sequencer;
  }

  void loadDeckFromProject(int deckId, DkgProject project) {
    if (deckId < 0 || deckId >= 4) return;
    _decks[deckId].rig = project;
    loadDeck(deckId, project.frames);
  }

  void setDeckMode(int deckId, MixMode mode) {
    if (deckId < 0 || deckId >= 4) return;
    _decks[deckId].mixMode = mode;
    _decks[deckId].isActive = mode != MixMode.off;
  }

  void setDeckOpacity(int deckId, double opacity) {
    if (deckId < 0 || deckId >= 4) return;
    _decks[deckId].opacity = opacity.clamp(0, 1);
  }

  GolemDeck? getDeck(int deckId) => deckId >= 0 && deckId < _decks.length
      ? _decks[deckId]
      : null;

  List<GolemDeck> getActiveDecks() =>
      _decks.where((deck) => deck.isActive && deck.mixMode != MixMode.off).toList();

  List<GolemDeck> getSequencerDecks() =>
      _decks.where((deck) => deck.isActive && deck.mixMode == MixMode.sequencer).toList();

  List<GolemDeck> getLayerDecks() =>
      _decks.where((deck) => deck.isActive && deck.mixMode == MixMode.layer).toList();

  void setCrossfader(double position) {
    _crossfaderPosition = position.clamp(0, 1);
  }

  double getCrossfader() => _crossfaderPosition;

  void setDeckFrameIndex(int deckId, int frameIndex) {
    if (deckId >= 0 && deckId < 4) {
      final deck = _decks[deckId];
      _deckFrameIndices[deckId] =
          frameIndex.clamp(0, max(0, deck.allFrames.length - 1));
    }
  }

  int getDeckFrameIndex(int deckId) => _deckFrameIndices[deckId];

  Map<String, dynamic>? getDeckInfo(int deckId) {
    final deck = getDeck(deckId);
    if (deck == null) return null;
    return {
      'mixMode': deck.mixMode,
      'isActive': deck.isActive,
      'frameCount': deck.allFrames.length,
    };
  }

  List<Map<String, dynamic>> getAllDeckModes() {
    return _decks
        .map(
          (deck) => {
            'id': deck.id,
            'mode': deck.mixMode,
            'active': deck.isActive,
            'frames': deck.allFrames.length,
          },
        )
        .toList();
  }

  void advanceDeckFrame(int deckId) {
    if (deckId >= 0 && deckId < 4) {
      final deck = _decks[deckId];
      if (deck.allFrames.isNotEmpty) {
        _deckFrameIndices[deckId] =
            (_deckFrameIndices[deckId] + 1) % deck.allFrames.length;
      }
    }
  }

  void setEngineMode(EngineMode mode) {
    _engineMode = mode;
  }

  void setPattern(PatternType pattern) {
    _activePattern = pattern;
    _patternIndex = 0;
    _patternFrameA = null;
    _patternFrameB = null;
    _patternFrameC = null;
  }

  void setSequenceMode(SequenceMode mode) {
    _kineticState.sequenceMode = mode;
  }

  void setBPM(double bpm) {
    _manualBPM = bpm.clamp(60, 200);
    if (!_autoBPM) {
      _kineticState.bpm = _manualBPM;
      _beatDuration = 60000 / _manualBPM;
    }
  }

  void setAutoBPM(bool enabled) {
    _autoBPM = enabled;
    if (!enabled) {
      _kineticState.bpm = _manualBPM;
      _beatDuration = 60000 / _manualBPM;
    }
  }

  void setTriggerStutter(bool active) => _triggerStutter = active;
  void setTriggerReverse(bool active) => _triggerReverse = active;
  void setTriggerGlitch(bool active) => _triggerGlitch = active;
  void setTriggerBurst(bool active) => _triggerBurst = active;

  void setEffect(String key, dynamic value) {
    switch (key) {
      case 'rgbSplit':
        _effects.rgbSplit = value as double;
        break;
      case 'flash':
        _effects.flash = value as double;
        break;
      case 'glitch':
        _effects.glitch = value as double;
        break;
      case 'scanlines':
        _effects.scanlines = value as double;
        break;
      case 'hueShift':
        _effects.hueShift = value as double;
        break;
      case 'aberration':
        _effects.aberration = value as double;
        break;
      case 'invert':
        _effects.invert = value as bool;
        break;
      case 'grayscale':
        _effects.grayscale = value as bool;
        break;
      case 'mirror':
        _effects.mirror = value as bool;
        break;
      case 'strobe':
        _effects.strobe = value as bool;
        break;
    }
  }

  EffectsState getEffects() => _effects.copy();

  List<T> _gatherFrames<T>(List<T> Function(GolemDeck deck) selector) {
    return getSequencerDecks().expand((deck) => selector(deck)).toList();
  }

  T? _selectRandom<T>(List<T> items) {
    if (items.isEmpty) return null;
    return items[_random.nextInt(items.length)];
  }

  void _updateKineticEngine(AudioData audio, double dt) {
    final bass = audio.bass;
    final mid = audio.mid;
    final high = audio.high;
    final now = audio.timestamp;

    final beatDetected = _bpmDetector.detectBeat(bass, now);
    if (_autoBPM) {
      final bpmResult = _bpmDetector.getBPM();
      if (bpmResult.confidence > 0.5) {
        _kineticState.bpm = bpmResult.bpm;
        _beatDuration = 60000 / bpmResult.bpm;
      }
    }

    _kineticState.beatPos = (now % _beatDuration) / _beatDuration;

    if (beatDetected) {
      _lastBeatTime = now;
      _kineticState.barCounter = (_kineticState.barCounter + 1) % 16;
      _kineticState.phraseCounter = (_kineticState.phraseCounter + 1) % 8;

      _physics.squash = 0.85;
      _physics.bounce = -50 * bass;
      _effects.flash = 0.3 * bass;
    }

    if (_kineticState.isLocked && now < _kineticState.lockReleaseTime) {
      return;
    }
    _kineticState.isLocked = false;

    _updateSequenceMode(audio);

    if (_triggerReverse) {
      _kineticState.sequenceMode = SequenceMode.groove;
    }
    if (_triggerGlitch) {
      _effects.glitch = 0.8;
      _effects.rgbSplit = 0.5;
    }

    final currentNode = kineticGraph[_kineticState.currentNode];
    if (currentNode == null) return;

    final energy = (bass + mid + high) / 3;
    if (energy > currentNode.exitThreshold) {
      final validTransitions = currentNode.transitions.where((nodeId) {
        final node = kineticGraph[nodeId];
        return node != null && energy >= node.energyRequired;
      }).toList();

      if (validTransitions.isNotEmpty && _random.nextDouble() < 0.3) {
        final nextNodeId = _selectRandom(validTransitions);
        if (nextNodeId != null) {
          _transitionToNode(nextNodeId, now);
        }
      }
    }

    if (beatDetected && !_kineticState.isLocked) {
      _selectFrameForMode();
    }
  }

  void _updateSequenceMode(AudioData audio) {
    final bass = audio.bass;
    final high = audio.high;
    final hasCloseups = _gatherFrames((deck) => deck.closeups).isNotEmpty;
    final hasHands = _gatherFrames((deck) => deck.hands).isNotEmpty;
    final hasFeet = _gatherFrames((deck) => deck.feet).isNotEmpty;

    final isDrop = bass > 0.8;
    final isPeak = high > 0.7;
    final isFill = _kineticState.phraseCounter == 7;

    if (isPeak && hasCloseups) {
      _kineticState.sequenceMode = SequenceMode.emote;
    } else if (isDrop && hasHands) {
      _kineticState.sequenceMode = SequenceMode.impact;
    } else if (_kineticState.barCounter >= 12 && hasFeet) {
      _kineticState.sequenceMode = SequenceMode.footwork;
    } else if (isFill) {
      _kineticState.sequenceMode = SequenceMode.impact;
    } else {
      _kineticState.sequenceMode = SequenceMode.groove;
    }
  }

  void _transitionToNode(String nodeId, int now) {
    final node = kineticGraph[nodeId];
    if (node == null) return;

    _kineticState.previousNode = _kineticState.currentNode;
    _kineticState.currentNode = nodeId;

    if (node.minDuration >= 500) {
      _kineticState.isLocked = true;
      _kineticState.lockReleaseTime = now + node.minDuration;
    }

    _selectFrameForMode();
  }

  void _selectFrameForMode() {
    List<DeckFrame> pool = [];
    var transition = TransitionMode.cut;

    switch (_kineticState.sequenceMode) {
      case SequenceMode.emote:
        pool = _gatherFrames((deck) => deck.virtuals);
        if (pool.isEmpty) pool = _gatherFrames((deck) => deck.closeups);
        transition = TransitionMode.zoomIn;
        break;
      case SequenceMode.footwork:
        pool = _gatherFrames((deck) => deck.feet);
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.mid] ?? []);
        }
        transition = TransitionMode.cut;
        break;
      case SequenceMode.impact:
        pool = _gatherFrames((deck) => deck.mandalas);
        if (pool.isEmpty) pool = _gatherFrames((deck) => deck.hands);
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.high] ?? []);
        }
        transition = TransitionMode.cut;
        _effects.flash = 0.5;
        break;
      case SequenceMode.groove:
        final dir = _kineticState.barCounter % 2 == 0
            ? MoveDirection.left
            : MoveDirection.right;
        pool = _gatherFrames(
          (deck) => deck.framesByEnergy[EnergyLevel.mid]
                  ?.where((frame) => frame.direction == dir)
                  .toList() ??
              [],
        );
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.mid] ?? []);
        }
        transition = TransitionMode.slide;
        break;
    }

    if (pool.isEmpty) {
      pool = _gatherFrames((deck) => deck.allFrames);
    }

    var newFrame = _selectRandom(pool);
    var attempts = 0;
    while (newFrame != null &&
        newFrame.pose == _currentFrame?.pose &&
        attempts < 3 &&
        pool.length > 1) {
      newFrame = _selectRandom(pool);
      attempts += 1;
    }

    if (newFrame != null && newFrame.pose != _currentFrame?.pose) {
      _previousFrame = _currentFrame;
      _currentFrame = newFrame;
      _transitionMode = transition;
      _transitionProgress = 0;
      _transitionSpeed = transition == TransitionMode.cut ? 100 : 8;
    }
  }

  void _updatePatternEngine(AudioData audio, double dt) {
    final bass = audio.bass;
    final mid = audio.mid;
    final high = audio.high;
    final now = audio.timestamp;

    final beatDetected = _bpmDetector.detectBeat(bass, now);
    if (!beatDetected) return;

    _lastBeatTime = now;
    _physics.squash = 0.85;
    _physics.bounce = -40 * bass;

    List<DeckFrame> pool = [];

    switch (_activePattern) {
      case PatternType.pingPong:
        _patternIndex = (_patternIndex + 1) % 2;
        final leftPool = _gatherFrames((deck) => deck.leftFrames);
        final rightPool = _gatherFrames((deck) => deck.rightFrames);
        final allFrames = _gatherFrames((deck) => deck.allFrames);
        if (leftPool.isNotEmpty && rightPool.isNotEmpty) {
          pool = _patternIndex == 0 ? leftPool : rightPool;
        } else if (allFrames.length >= 2) {
          final half = (allFrames.length / 2).ceil();
          pool = _patternIndex == 0
              ? allFrames.sublist(0, half)
              : allFrames.sublist(half);
        } else {
          pool = allFrames;
        }
        break;
      case PatternType.abab:
        _patternIndex = (_patternIndex + 1) % 2;
        final allFrames = _gatherFrames((deck) => deck.allFrames);
        if (_patternIndex == 0 && _random.nextDouble() < 0.15) {
          _patternFrameA = null;
          _patternFrameB = null;
        }
        if (_patternIndex == 0) {
          _patternFrameA ??= _selectRandom(allFrames);
          if (_patternFrameA != null) {
            _triggerFrame(_patternFrameA, TransitionMode.cut, true);
          }
        } else {
          if (_patternFrameB == null) {
            final candidates = allFrames
                .where((frame) => frame.pose != _patternFrameA?.pose)
                .toList();
            _patternFrameB = candidates.isNotEmpty
                ? _selectRandom(candidates)
                : (allFrames.length > 1
                    ? allFrames[1]
                    : _selectRandom(allFrames));
          }
          if (_patternFrameB != null) {
            _triggerFrame(_patternFrameB, TransitionMode.cut, true);
          }
        }
        return;
      case PatternType.aabb:
        _patternIndex = (_patternIndex + 1) % 4;
        final allFrames = _gatherFrames((deck) => deck.allFrames);
        if (_patternIndex == 0 && _random.nextDouble() < 0.2) {
          _patternFrameA = null;
          _patternFrameB = null;
        }
        if (_patternIndex < 2) {
          _patternFrameA ??= _selectRandom(allFrames);
          if (_patternFrameA != null) {
            _triggerFrame(_patternFrameA, TransitionMode.cut, true);
          }
        } else {
          if (_patternFrameB == null) {
            final candidates = allFrames
                .where((frame) => frame.pose != _patternFrameA?.pose)
                .toList();
            _patternFrameB = candidates.isNotEmpty
                ? _selectRandom(candidates)
                : (allFrames.length > 1
                    ? allFrames[1]
                    : _selectRandom(allFrames));
          }
          if (_patternFrameB != null) {
            _triggerFrame(_patternFrameB, TransitionMode.cut, true);
          }
        }
        return;
      case PatternType.abac:
        _patternIndex = (_patternIndex + 1) % 4;
        final allFrames = _gatherFrames((deck) => deck.allFrames);
        if (_patternIndex == 0 && _random.nextDouble() < 0.12) {
          _patternFrameA = null;
          _patternFrameB = null;
          _patternFrameC = null;
        }
        _patternFrameA ??= _selectRandom(allFrames);
        if (_patternFrameB == null) {
          final candidates = allFrames
              .where((frame) => frame.pose != _patternFrameA?.pose)
              .toList();
          _patternFrameB = candidates.isNotEmpty
              ? _selectRandom(candidates)
              : (allFrames.length > 1
                  ? allFrames[1]
                  : _selectRandom(allFrames));
        }
        if (_patternFrameC == null) {
          final candidates = allFrames
              .where((frame) =>
                  frame.pose != _patternFrameA?.pose &&
                  frame.pose != _patternFrameB?.pose)
              .toList();
          _patternFrameC = candidates.isNotEmpty
              ? _selectRandom(candidates)
              : (allFrames.length > 2
                  ? allFrames[2]
                  : _selectRandom(allFrames));
        }
        final abac = [_patternFrameA, _patternFrameB, _patternFrameA, _patternFrameC];
        final selected = abac[_patternIndex];
        if (selected != null) {
          _triggerFrame(selected, TransitionMode.cut, true);
        }
        return;
      case PatternType.stutter:
      case PatternType.snareRoll:
        if (mid > 0.6 || _triggerStutter) {
          _transitionProgress = 0;
          _transitionSpeed = 50;
          _effects.glitch = 0.3;
          return;
        }
        pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.high] ?? []);
        break;
      case PatternType.buildDrop:
      case PatternType.impact:
        if (bass > 0.7) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.high] ?? []);
          _effects.flash = 0.4;
        } else {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.low] ?? []);
        }
        break;
      case PatternType.vogue:
        pool = _gatherFrames((deck) => deck.closeups);
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.high] ?? []);
        }
        break;
      case PatternType.flow:
        pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.mid] ?? []);
        _transitionMode = TransitionMode.smooth;
        _transitionSpeed = 3;
        break;
      case PatternType.chaos:
        pool = _gatherFrames((deck) => deck.allFrames);
        _effects.glitch = _random.nextDouble() * 0.5;
        break;
      case PatternType.minimal:
        pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.low] ?? []);
        break;
      case PatternType.groove:
        final dir = _kineticState.barCounter % 2 == 0
            ? MoveDirection.left
            : MoveDirection.right;
        pool = _gatherFrames(
          (deck) => deck.framesByEnergy[EnergyLevel.mid]
                  ?.where((frame) => frame.direction == dir)
                  .toList() ??
              [],
        );
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.mid] ?? []);
        }
        break;
      case PatternType.emote:
        pool = _gatherFrames((deck) => deck.closeups);
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.high] ?? []);
        }
        _transitionMode = TransitionMode.zoomIn;
        break;
      case PatternType.footwork:
        pool = _gatherFrames((deck) => deck.feet);
        if (pool.isEmpty) {
          pool = _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.mid] ?? []);
        }
        break;
    }

    if (pool.isEmpty) {
      pool = _gatherFrames((deck) => deck.allFrames);
    }

    var newFrame = _selectRandom(pool);
    if (pool.length > 1 && newFrame?.pose == _currentFrame?.pose) {
      final alternatives = pool
          .where((frame) => frame.pose != _currentFrame?.pose)
          .toList();
      if (alternatives.isNotEmpty) {
        newFrame = _selectRandom(alternatives);
      }
    }

    _triggerFrame(newFrame, _transitionMode, true);
  }

  void _triggerFrame(DeckFrame? frame, TransitionMode mode, bool forceTransition) {
    if (frame == null) return;
    _frameWasSelected = true;

    final isSameFrame = frame.pose == _currentFrame?.pose;
    if (isSameFrame && !forceTransition) {
      _transitionProgress = 0.5;
      _physics.squash = 0.9;
      return;
    }

    _previousFrame = _currentFrame;
    _currentFrame = frame;
    _transitionMode = mode;
    _transitionProgress = 0;

    switch (mode) {
      case TransitionMode.cut:
        _transitionSpeed = 100;
        break;
      case TransitionMode.slide:
        _transitionSpeed = 8;
        break;
      case TransitionMode.morph:
        _transitionSpeed = 5;
        break;
      case TransitionMode.smooth:
        _transitionSpeed = 3;
        break;
      case TransitionMode.zoomIn:
        _transitionSpeed = 6;
        break;
    }
  }

  void _updatePhysics(AudioData audio, double dt) {
    final bass = audio.bass;
    final mid = audio.mid;
    final high = audio.high;
    const stiffness = 140;
    const damping = 8;

    final targetRotX = bass * 35;
    final targetRotY = mid * 25 * sin(DateTime.now().millisecondsSinceEpoch * 0.005);
    final targetRotZ = high * 15;

    _physics.velocity.x +=
        ((targetRotX - _physics.rotation.x) * stiffness - _physics.velocity.x * damping) * dt;
    _physics.rotation.x += _physics.velocity.x * dt;

    _physics.velocity.y +=
        ((targetRotY - _physics.rotation.y) * stiffness * 0.5 -
                _physics.velocity.y * damping * 0.8) *
            dt;
    _physics.rotation.y += _physics.velocity.y * dt;

    _physics.velocity.z +=
        ((targetRotZ - _physics.rotation.z) * stiffness - _physics.velocity.z * damping) * dt;
    _physics.rotation.z += _physics.velocity.z * dt;

    _physics.squash += (1.0 - _physics.squash) * (12 * dt);
    _physics.bounce += (0 - _physics.bounce) * (10 * dt);
    _physics.zoom += (1.15 - _physics.zoom) * (5 * dt);

    if (_transitionProgress < 1.0) {
      _transitionProgress += _transitionSpeed * dt;
      if (_transitionProgress > 1.0) {
        _transitionProgress = 1.0;
      }
    }

    _effects.flash *= exp(-15 * dt);
    _effects.glitch *= exp(-10 * dt);
    _effects.rgbSplit *= exp(-8 * dt);
  }

  MixerOutput update(AudioData audio) {
    final now = audio.timestamp;
    final dt = min((now - _lastUpdateTime) / 1000, 0.1);
    _lastUpdateTime = now;

    _frameWasSelected = false;

    _frameCount += 1;
    if (now - _lastFpsTime > 1000) {
      _currentFps = _frameCount;
      _frameCount = 0;
      _lastFpsTime = now;
    }

    if (_triggerStutter && _currentFrame != null) {
      _transitionProgress = 0;
      _transitionSpeed = 50;
      _frameWasSelected = true;
    }

    if (_engineMode == EngineMode.kinetic) {
      _updateKineticEngine(audio, dt);
    } else {
      _updatePatternEngine(audio, dt);
    }

    _updatePhysics(audio, dt);

    final layeredFrames = getLayerDecks().map((deck) {
      final frameIndex = _deckFrameIndices[deck.id] % max(1, deck.allFrames.length);
      final frame = deck.allFrames.isNotEmpty ? deck.allFrames[frameIndex] : null;
      if (frame == null) return null;
      return MixerLayeredFrame(
        frame: frame.copyWith(deckId: deck.id),
        deckId: deck.id,
        opacity: deck.opacity,
        blendMode: 'normal',
      );
    }).whereType<MixerLayeredFrame>().toList();

    return MixerOutput(
      frame: _currentFrame,
      deckId: _currentFrame?.deckId ?? 0,
      transitionMode: _transitionMode,
      transitionSpeed: _transitionSpeed,
      physics: _physics.copy(),
      effects: _effects.copy(),
      sequenceMode: _kineticState.sequenceMode,
      isTransitioning: _transitionProgress < 1.0,
      didSelectFrame: _frameWasSelected,
      layeredFrames: layeredFrames,
      crossfaderPosition: _crossfaderPosition,
    );
  }

  MixerTelemetry getTelemetry() {
    return MixerTelemetry(
      fps: _currentFps,
      bpm: _kineticState.bpm,
      bpmConfidence: _autoBPM ? _bpmDetector.getBPM().confidence : 1,
      barCounter: _kineticState.barCounter,
      phraseCounter: _kineticState.phraseCounter,
      beatPos: _kineticState.beatPos,
      sequenceMode: _kineticState.sequenceMode,
      engineMode: _engineMode,
      activePattern: _activePattern,
      currentNode: _kineticState.currentNode,
      activeDecks: getActiveDecks().map((deck) => deck.id).toList(),
      poolCounts: {
        'low': _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.low] ?? []).length,
        'mid': _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.mid] ?? []).length,
        'high': _gatherFrames((deck) => deck.framesByEnergy[EnergyLevel.high] ?? []).length,
        'closeups': _gatherFrames((deck) => deck.closeups).length,
        'hands': _gatherFrames((deck) => deck.hands).length,
        'feet': _gatherFrames((deck) => deck.feet).length,
        'mandalas': _gatherFrames((deck) => deck.mandalas).length,
      },
    );
  }

  void reset() {
    _bpmDetector.reset();
    _kineticState = KineticState(
      currentNode: 'idle',
      previousNode: 'idle',
      beatPos: 0,
      barCounter: 0,
      phraseCounter: 0,
      bpm: 120,
      isLocked: false,
      lockReleaseTime: 0,
      sequenceMode: SequenceMode.groove,
    );
    _patternIndex = 0;
    _patternFrameA = null;
    _patternFrameB = null;
    _patternFrameC = null;
    _transitionProgress = 1.0;
  }
}
