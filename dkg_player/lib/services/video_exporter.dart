import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
// Note: ffmpeg_kit_flutter required for actual encoding
// import 'package:ffmpeg_kit_flutter/ffmpeg_kit.dart';

/// Video export settings
class ExportSettings {
  final int width;
  final int height;
  final int fps;
  final int durationSeconds;
  final double quality; // 0-1, affects bitrate
  final bool includeWatermark;
  final String watermarkText;
  final WatermarkPosition watermarkPosition;
  final AspectRatio aspectRatio;

  const ExportSettings({
    this.width = 1080,
    this.height = 1920,
    this.fps = 30,
    this.durationSeconds = 15,
    this.quality = 0.8,
    this.includeWatermark = true,
    this.watermarkText = 'jusDNCE',
    this.watermarkPosition = WatermarkPosition.bottomRight,
    this.aspectRatio = AspectRatio.portrait9x16,
  });

  /// Preset for quick sharing (optimized for size/speed)
  static const ExportSettings quickShare = ExportSettings(
    width: 720,
    height: 1280,
    fps: 30,
    quality: 0.6,
    includeWatermark: true,
  );

  /// Preset for high quality
  static const ExportSettings highQuality = ExportSettings(
    width: 1080,
    height: 1920,
    fps: 60,
    quality: 0.9,
    includeWatermark: true,
  );

  /// Preset for social media (square)
  static const ExportSettings socialSquare = ExportSettings(
    width: 1080,
    height: 1080,
    fps: 30,
    quality: 0.7,
    includeWatermark: true,
    aspectRatio: AspectRatio.square1x1,
  );

  /// Get dimensions based on aspect ratio
  (int, int) getDimensions() {
    switch (aspectRatio) {
      case AspectRatio.portrait9x16:
        return (width, (width * 16 / 9).round());
      case AspectRatio.landscape16x9:
        return ((height * 16 / 9).round(), height);
      case AspectRatio.square1x1:
        return (width, width);
      case AspectRatio.portrait4x5:
        return (width, (width * 5 / 4).round());
    }
  }
}

enum WatermarkPosition {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  center,
}

enum AspectRatio {
  portrait9x16,  // TikTok, Reels, Stories
  landscape16x9, // YouTube, traditional video
  square1x1,     // Instagram feed
  portrait4x5,   // Instagram portrait
}

/// Export progress callback
typedef ExportProgressCallback = void Function(double progress, String status);

/// Service for exporting video with watermark
class VideoExporter {
  /// Generate watermark overlay
  static Future<ui.Image> _generateWatermark(
    String text,
    int width,
    int height,
    WatermarkPosition position,
  ) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);

    // Watermark style
    final textStyle = TextStyle(
      fontFamily: 'Rajdhani',
      fontSize: width * 0.03, // 3% of width
      fontWeight: FontWeight.w700,
      color: Colors.white.withOpacity(0.6),
      shadows: [
        Shadow(
          color: Colors.black.withOpacity(0.5),
          blurRadius: 4,
          offset: const Offset(1, 1),
        ),
      ],
    );

    final textSpan = TextSpan(text: text, style: textStyle);
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();

    // Calculate position
    double x, y;
    final margin = width * 0.03; // 3% margin

    switch (position) {
      case WatermarkPosition.topLeft:
        x = margin;
        y = margin;
        break;
      case WatermarkPosition.topRight:
        x = width - textPainter.width - margin;
        y = margin;
        break;
      case WatermarkPosition.bottomLeft:
        x = margin;
        y = height - textPainter.height - margin;
        break;
      case WatermarkPosition.bottomRight:
        x = width - textPainter.width - margin;
        y = height - textPainter.height - margin;
        break;
      case WatermarkPosition.center:
        x = (width - textPainter.width) / 2;
        y = (height - textPainter.height) / 2;
        break;
    }

    textPainter.paint(canvas, Offset(x, y));

    final picture = recorder.endRecording();
    return picture.toImage(width, height);
  }

  /// Export frames to MP4 video
  ///
  /// This is a scaffolded implementation. Full implementation requires:
  /// 1. ffmpeg_kit_flutter package
  /// 2. Platform-specific setup for Android/iOS
  /// 3. Proper frame capture from the rendering canvas
  static Future<String?> exportToMP4({
    required List<Uint8List> frames,
    required ExportSettings settings,
    ExportProgressCallback? onProgress,
  }) async {
    try {
      onProgress?.call(0.0, 'Preparing export...');

      // Get output directory
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = '${tempDir.path}/jusdnce_$timestamp.mp4';
      final framesDir = Directory('${tempDir.path}/frames_$timestamp');
      await framesDir.create(recursive: true);

      // Save frames as images
      onProgress?.call(0.1, 'Processing frames...');
      for (int i = 0; i < frames.length; i++) {
        final framePath = '${framesDir.path}/frame_${i.toString().padLeft(5, '0')}.png';
        await File(framePath).writeAsBytes(frames[i]);
        onProgress?.call(0.1 + (0.4 * i / frames.length), 'Processing frame ${i + 1}/${frames.length}');
      }

      // Generate watermark if needed
      if (settings.includeWatermark) {
        onProgress?.call(0.5, 'Adding watermark...');
        // Watermark would be composited via FFmpeg filter
      }

      // Calculate bitrate based on quality
      final bitrate = (settings.quality * 8000000).round(); // 0.8 quality = 6.4 Mbps

      // FFmpeg command (placeholder - requires ffmpeg_kit_flutter)
      // final ffmpegCommand = [
      //   '-framerate', '${settings.fps}',
      //   '-i', '${framesDir.path}/frame_%05d.png',
      //   '-c:v', 'libx264',
      //   '-preset', 'fast',
      //   '-b:v', '${bitrate}',
      //   '-pix_fmt', 'yuv420p',
      //   '-vf', 'scale=${settings.width}:${settings.height}',
      //   outputPath,
      // ].join(' ');

      onProgress?.call(0.6, 'Encoding video...');

      // Simulated encoding (replace with actual FFmpeg call)
      // await FFmpegKit.execute(ffmpegCommand);

      // For now, just copy the first frame as placeholder
      if (frames.isNotEmpty) {
        await File(outputPath).writeAsBytes(frames.first);
      }

      onProgress?.call(0.9, 'Finalizing...');

      // Cleanup temp frames
      await framesDir.delete(recursive: true);

      onProgress?.call(1.0, 'Complete!');

      return outputPath;
    } catch (e) {
      onProgress?.call(0.0, 'Error: $e');
      return null;
    }
  }

  /// Export to camera roll
  static Future<bool> saveToGallery(String videoPath) async {
    // Implementation depends on platform:
    // - Android: MediaStore API
    // - iOS: PHPhotoLibrary
    // Use packages like 'gallery_saver' or 'image_gallery_saver'

    final file = File(videoPath);
    if (!await file.exists()) return false;

    // Placeholder - actual implementation needs platform channels
    // or packages like gallery_saver
    return true;
  }

  /// Get estimated file size for settings
  static int estimateFileSize(ExportSettings settings) {
    final bitrate = settings.quality * 8000000; // bits per second
    final durationSeconds = settings.durationSeconds;
    final sizeInBits = bitrate * durationSeconds;
    final sizeInBytes = sizeInBits / 8;
    return sizeInBytes.round();
  }

  /// Format file size for display
  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

/// Widget for export settings UI
class ExportSettingsSheet extends StatefulWidget {
  final ExportSettings initialSettings;
  final Function(ExportSettings) onExport;

  const ExportSettingsSheet({
    super.key,
    this.initialSettings = const ExportSettings(),
    required this.onExport,
  });

  @override
  State<ExportSettingsSheet> createState() => _ExportSettingsSheetState();
}

class _ExportSettingsSheetState extends State<ExportSettingsSheet> {
  late ExportSettings _settings;

  @override
  void initState() {
    super.initState();
    _settings = widget.initialSettings;
  }

  @override
  Widget build(BuildContext context) {
    final estimatedSize = VideoExporter.estimateFileSize(_settings);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'EXPORT VIDEO',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 2,
                ),
              ),
              Text(
                '~${VideoExporter.formatFileSize(estimatedSize)}',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 14,
                  color: Colors.white.withOpacity(0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Presets
          const Text(
            'PRESET',
            style: TextStyle(
              fontFamily: 'Rajdhani',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.white54,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildPresetButton('QUICK', ExportSettings.quickShare),
              const SizedBox(width: 8),
              _buildPresetButton('HD', ExportSettings.highQuality),
              const SizedBox(width: 8),
              _buildPresetButton('SQUARE', ExportSettings.socialSquare),
            ],
          ),
          const SizedBox(height: 20),

          // Aspect Ratio
          const Text(
            'ASPECT RATIO',
            style: TextStyle(
              fontFamily: 'Rajdhani',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.white54,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildARButton('9:16', AspectRatio.portrait9x16),
              const SizedBox(width: 8),
              _buildARButton('16:9', AspectRatio.landscape16x9),
              const SizedBox(width: 8),
              _buildARButton('1:1', AspectRatio.square1x1),
              const SizedBox(width: 8),
              _buildARButton('4:5', AspectRatio.portrait4x5),
            ],
          ),
          const SizedBox(height: 20),

          // Quality slider
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'QUALITY',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white54,
                  letterSpacing: 2,
                ),
              ),
              Text(
                '${(_settings.quality * 100).round()}%',
                style: const TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 12,
                  color: Color(0xFF8B5CF6),
                ),
              ),
            ],
          ),
          Slider(
            value: _settings.quality,
            min: 0.3,
            max: 1.0,
            activeColor: const Color(0xFF8B5CF6),
            inactiveColor: Colors.white.withOpacity(0.2),
            onChanged: (v) => setState(() {
              _settings = ExportSettings(
                width: _settings.width,
                height: _settings.height,
                fps: _settings.fps,
                durationSeconds: _settings.durationSeconds,
                quality: v,
                includeWatermark: _settings.includeWatermark,
                watermarkText: _settings.watermarkText,
                watermarkPosition: _settings.watermarkPosition,
                aspectRatio: _settings.aspectRatio,
              );
            }),
          ),
          const SizedBox(height: 12),

          // Watermark toggle
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'WATERMARK',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white54,
                  letterSpacing: 2,
                ),
              ),
              Switch(
                value: _settings.includeWatermark,
                activeColor: const Color(0xFF8B5CF6),
                onChanged: (v) => setState(() {
                  _settings = ExportSettings(
                    width: _settings.width,
                    height: _settings.height,
                    fps: _settings.fps,
                    durationSeconds: _settings.durationSeconds,
                    quality: _settings.quality,
                    includeWatermark: v,
                    watermarkText: _settings.watermarkText,
                    watermarkPosition: _settings.watermarkPosition,
                    aspectRatio: _settings.aspectRatio,
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Export button
          ElevatedButton(
            onPressed: () => widget.onExport(_settings),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'EXPORT MP4',
              style: TextStyle(
                fontFamily: 'Rajdhani',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 2,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildPresetButton(String label, ExportSettings preset) {
    final isSelected = _settings.quality == preset.quality &&
        _settings.width == preset.width;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _settings = preset),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF8B5CF6).withOpacity(0.3)
                : Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF8B5CF6)
                  : Colors.white.withOpacity(0.2),
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Rajdhani',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? const Color(0xFF8B5CF6) : Colors.white54,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildARButton(String label, AspectRatio ar) {
    final isSelected = _settings.aspectRatio == ar;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() {
          _settings = ExportSettings(
            width: _settings.width,
            height: _settings.height,
            fps: _settings.fps,
            durationSeconds: _settings.durationSeconds,
            quality: _settings.quality,
            includeWatermark: _settings.includeWatermark,
            watermarkText: _settings.watermarkText,
            watermarkPosition: _settings.watermarkPosition,
            aspectRatio: ar,
          );
        }),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF00FFFF).withOpacity(0.2)
                : Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF00FFFF)
                  : Colors.white.withOpacity(0.2),
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Rajdhani',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? const Color(0xFF00FFFF) : Colors.white54,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
