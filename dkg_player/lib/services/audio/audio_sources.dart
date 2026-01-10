import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_sound/flutter_sound.dart';
import 'package:permission_handler/permission_handler.dart';

abstract class AudioSampleSource {
  Stream<List<double>> get samples;
  Future<void> start();
  Future<void> stop();
}

class FileAudioSource implements AudioSampleSource {
  FileAudioSource(this.file, {this.sampleBatchSize = 1024});

  final File file;
  final int sampleBatchSize;
  final StreamController<List<double>> _controller = StreamController.broadcast();
  StreamSubscription<List<double>>? _subscription;

  @override
  Stream<List<double>> get samples => _controller.stream;

  @override
  Future<void> start() async {
    final bytes = await file.readAsBytes();
    final samples = _decodePcm16Wav(bytes);
    _subscription = _chunkSamples(samples, sampleBatchSize).listen(_controller.add);
  }

  @override
  Future<void> stop() async {
    await _subscription?.cancel();
    await _controller.close();
  }

  List<double> _decodePcm16Wav(Uint8List bytes) {
    if (bytes.length < 44) return [];
    final dataOffset = 44;
    final byteData = bytes.buffer.asByteData();
    final samples = <double>[];
    for (var i = dataOffset; i + 1 < bytes.length; i += 2) {
      final sample = byteData.getInt16(i, Endian.little);
      samples.add(sample / 32768.0);
    }
    return samples;
  }

  Stream<List<double>> _chunkSamples(List<double> samples, int size) async* {
    for (var i = 0; i < samples.length; i += size) {
      yield samples.sublist(i, (i + size).clamp(0, samples.length));
      await Future<void>.delayed(const Duration(milliseconds: 16));
    }
  }
}

class MicAudioSource implements AudioSampleSource {
  MicAudioSource({this.sampleBatchSize = 1024});

  final int sampleBatchSize;
  final FlutterSoundRecorder _recorder = FlutterSoundRecorder();
  final StreamController<List<double>> _controller = StreamController.broadcast();
  final StreamController<Uint8List> _rawController = StreamController.broadcast();

  StreamSubscription? _subscription;

  @override
  Stream<List<double>> get samples => _controller.stream;

  @override
  Future<void> start() async {
    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      throw Exception('Microphone permission not granted');
    }

    await _recorder.openRecorder();
    _subscription = _rawController.stream.listen((data) {
      _controller.add(_decodePcm16(data));
    });

    await _recorder.startRecorder(
      toStream: _rawController.sink,
      codec: Codec.pcm16,
      sampleRate: 44100,
      numChannels: 1,
    );
  }

  @override
  Future<void> stop() async {
    await _recorder.stopRecorder();
    await _subscription?.cancel();
    await _recorder.closeRecorder();
    await _rawController.close();
    await _controller.close();
  }

  List<double> _decodePcm16(Uint8List bytes) {
    final byteData = bytes.buffer.asByteData();
    final samples = <double>[];
    for (var i = 0; i + 1 < bytes.length; i += 2) {
      final sample = byteData.getInt16(i, Endian.little);
      samples.add(sample / 32768.0);
    }
    return samples;
  }
}
