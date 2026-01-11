import 'dart:async';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';

/// Audio analysis result containing frequency and beat data
class AudioAnalysis {
  final double bass;      // 0-1 bass level
  final double mid;       // 0-1 mid level
  final double high;      // 0-1 high level
  final double energy;    // 0-1 overall energy
  final bool isBeat;      // true if a beat was detected
  final bool isKick;      // true if kick drum detected
  final bool isSnare;     // true if snare detected
  final double bpm;       // estimated BPM

  AudioAnalysis({
    required this.bass,
    required this.mid,
    required this.high,
    required this.energy,
    required this.isBeat,
    required this.isKick,
    required this.isSnare,
    required this.bpm,
  });

  static AudioAnalysis silent() => AudioAnalysis(
    bass: 0, mid: 0, high: 0, energy: 0,
    isBeat: false, isKick: false, isSnare: false, bpm: 0,
  );
}

/// Service for analyzing audio in real-time
class AudioAnalyzer with ChangeNotifier {
  // FFT settings
  static const int fftSize = 2048;
  static const int sampleRate = 44100;

  // Frequency band ranges (Hz)
  static const double bassLow = 20;
  static const double bassHigh = 250;
  static const double midLow = 250;
  static const double midHigh = 2000;
  static const double highLow = 2000;
  static const double highHigh = 16000;

  // Beat detection
  final List<double> _energyHistory = [];
  final List<int> _beatTimes = [];
  static const int energyHistorySize = 43; // ~1 second at 60fps
  static const double beatThreshold = 1.3;

  // Current analysis
  AudioAnalysis _current = AudioAnalysis.silent();
  AudioAnalysis get current => _current;

  // BPM tracking
  double _estimatedBpm = 0;
  double get estimatedBpm => _estimatedBpm;

  // Stream controller for analysis updates
  final _analysisController = StreamController<AudioAnalysis>.broadcast();
  Stream<AudioAnalysis> get analysisStream => _analysisController.stream;

  /// Process raw audio samples (PCM float32)
  void processAudioData(Float32List samples) {
    if (samples.isEmpty) return;

    // Simple energy calculation (no FFT for now - would need native FFT)
    // This is a simplified version - real impl would use FFT
    double totalEnergy = 0;
    double bassEnergy = 0;
    double midEnergy = 0;
    double highEnergy = 0;

    // Simple time-domain analysis with pseudo-frequency separation
    final segmentSize = samples.length ~/ 3;

    for (int i = 0; i < samples.length; i++) {
      final sample = samples[i].abs();
      totalEnergy += sample * sample;

      // Rough frequency estimation based on zero crossings in segments
      if (i < segmentSize) {
        bassEnergy += sample;
      } else if (i < segmentSize * 2) {
        midEnergy += sample;
      } else {
        highEnergy += sample;
      }
    }

    totalEnergy = sqrt(totalEnergy / samples.length);
    bassEnergy = bassEnergy / segmentSize * 3;
    midEnergy = midEnergy / segmentSize * 3;
    highEnergy = highEnergy / segmentSize * 3;

    // Normalize to 0-1 range
    final maxVal = max(max(bassEnergy, midEnergy), highEnergy);
    if (maxVal > 0) {
      bassEnergy /= maxVal;
      midEnergy /= maxVal;
      highEnergy /= maxVal;
    }

    // Beat detection
    _energyHistory.add(totalEnergy);
    if (_energyHistory.length > energyHistorySize) {
      _energyHistory.removeAt(0);
    }

    final avgEnergy = _energyHistory.isNotEmpty
        ? _energyHistory.reduce((a, b) => a + b) / _energyHistory.length
        : 0.0;

    final isBeat = totalEnergy > avgEnergy * beatThreshold;
    final isKick = isBeat && bassEnergy > 0.6;
    final isSnare = isBeat && highEnergy > 0.5;

    // Track beat times for BPM
    if (isBeat) {
      final now = DateTime.now().millisecondsSinceEpoch;
      _beatTimes.add(now);
      // Keep last 20 beats
      while (_beatTimes.length > 20) {
        _beatTimes.removeAt(0);
      }
      _calculateBpm();
    }

    // Create analysis result
    _current = AudioAnalysis(
      bass: bassEnergy.clamp(0.0, 1.0),
      mid: midEnergy.clamp(0.0, 1.0),
      high: highEnergy.clamp(0.0, 1.0),
      energy: totalEnergy.clamp(0.0, 1.0),
      isBeat: isBeat,
      isKick: isKick,
      isSnare: isSnare,
      bpm: _estimatedBpm,
    );

    _analysisController.add(_current);
    notifyListeners();
  }

  void _calculateBpm() {
    if (_beatTimes.length < 4) {
      _estimatedBpm = 0;
      return;
    }

    // Calculate intervals between beats
    final intervals = <int>[];
    for (int i = 1; i < _beatTimes.length; i++) {
      intervals.add(_beatTimes[i] - _beatTimes[i - 1]);
    }

    // Filter outliers (keep intervals between 300ms and 2000ms = 30-200 BPM)
    final validIntervals = intervals.where((i) => i >= 300 && i <= 2000).toList();
    if (validIntervals.isEmpty) return;

    // Average interval to BPM
    final avgInterval = validIntervals.reduce((a, b) => a + b) / validIntervals.length;
    _estimatedBpm = 60000 / avgInterval;
  }

  /// Simulate analysis for testing (generates pseudo-random values)
  void simulateAudio(double time) {
    // Generate sine waves at different frequencies
    final bass = (sin(time * 2) + 1) / 2 * 0.8;
    final mid = (sin(time * 4 + 1) + 1) / 2 * 0.6;
    final high = (sin(time * 8 + 2) + 1) / 2 * 0.4;
    final energy = (bass + mid + high) / 3;

    // Simulate beats at ~120 BPM
    final beatPhase = (time * 2) % 1;
    final isBeat = beatPhase < 0.1;
    final isKick = isBeat && beatPhase < 0.05;
    final isSnare = isBeat && beatPhase >= 0.05;

    _current = AudioAnalysis(
      bass: bass,
      mid: mid,
      high: high,
      energy: energy,
      isBeat: isBeat,
      isKick: isKick,
      isSnare: isSnare,
      bpm: 120,
    );

    _analysisController.add(_current);
    notifyListeners();
  }

  void reset() {
    _energyHistory.clear();
    _beatTimes.clear();
    _estimatedBpm = 0;
    _current = AudioAnalysis.silent();
    notifyListeners();
  }

  @override
  void dispose() {
    _analysisController.close();
    super.dispose();
  }
}
