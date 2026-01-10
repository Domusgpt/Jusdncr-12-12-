import 'dart:async';
import 'dart:math';

class AudioFeatures {
  AudioFeatures({
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

class Complex {
  Complex(this.re, this.im);

  final double re;
  final double im;

  Complex operator +(Complex other) =>
      Complex(re + other.re, im + other.im);
  Complex operator -(Complex other) =>
      Complex(re - other.re, im - other.im);
  Complex operator *(Complex other) => Complex(
        re * other.re - im * other.im,
        re * other.im + im * other.re,
      );

  double magnitude() => sqrt(re * re + im * im);
}

class FFTAnalyzer {
  FFTAnalyzer({this.sampleRate = 44100});

  final int sampleRate;

  List<Complex> _fft(List<Complex> input) {
    final n = input.length;
    if (n <= 1) return input;

    final even = List<Complex>.generate(n ~/ 2, (i) => input[i * 2]);
    final odd = List<Complex>.generate(n ~/ 2, (i) => input[i * 2 + 1]);

    final fftEven = _fft(even);
    final fftOdd = _fft(odd);

    final result = List<Complex>.filled(n, Complex(0, 0));
    for (var k = 0; k < n ~/ 2; k++) {
      final angle = -2 * pi * k / n;
      final twiddle = Complex(cos(angle), sin(angle));
      final t = twiddle * fftOdd[k];
      result[k] = fftEven[k] + t;
      result[k + n ~/ 2] = fftEven[k] - t;
    }
    return result;
  }

  AudioFeatures analyze(List<double> samples) {
    final size = _nextPowerOfTwo(samples.length);
    final windowed = List<Complex>.generate(size, (i) {
      final sample = i < samples.length ? samples[i] : 0.0;
      final window = 0.5 * (1 - cos(2 * pi * i / (size - 1)));
      return Complex(sample * window, 0);
    });

    final spectrum = _fft(windowed);
    final magnitudes = spectrum
        .sublist(0, spectrum.length ~/ 2)
        .map((value) => value.magnitude())
        .toList();

    final bass = _bandEnergy(magnitudes, 20, 250);
    final mid = _bandEnergy(magnitudes, 250, 2000);
    final high = _bandEnergy(magnitudes, 2000, 8000);
    final energy = (bass + mid + high) / 3;

    return AudioFeatures(
      bass: bass,
      mid: mid,
      high: high,
      energy: energy,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
  }

  Stream<AudioFeatures> analyzeStream(Stream<List<double>> stream) {
    return stream.map(analyze);
  }

  double _bandEnergy(List<double> magnitudes, int lowHz, int highHz) {
    final binSize = sampleRate / (magnitudes.length * 2);
    final start = (lowHz / binSize).floor().clamp(0, magnitudes.length - 1);
    final end = (highHz / binSize).ceil().clamp(0, magnitudes.length - 1);
    if (end <= start) return 0;

    final slice = magnitudes.sublist(start, end);
    final avg = slice.reduce((a, b) => a + b) / slice.length;
    return avg.clamp(0, 1);
  }

  int _nextPowerOfTwo(int value) {
    var v = max(1, value);
    var power = 1;
    while (power < v) {
      power <<= 1;
    }
    return power;
  }
}
