import 'dart:async';

import 'audio_sources.dart';
import 'fft_analyzer.dart';

class AudioEngine {
  AudioEngine({required this.analyzer});

  final FFTAnalyzer analyzer;
  AudioSampleSource? _source;
  StreamSubscription<List<double>>? _subscription;
  final StreamController<AudioFeatures> _featuresController =
      StreamController.broadcast();

  Stream<AudioFeatures> get features => _featuresController.stream;

  Future<void> attachSource(AudioSampleSource source) async {
    await detachSource();
    _source = source;
    _subscription = source.samples.listen((samples) {
      _featuresController.add(analyzer.analyze(samples));
    });
    await source.start();
  }

  Future<void> detachSource() async {
    await _subscription?.cancel();
    _subscription = null;
    if (_source != null) {
      await _source?.stop();
      _source = null;
    }
  }

  Future<void> dispose() async {
    await detachSource();
    await _featuresController.close();
  }
}
