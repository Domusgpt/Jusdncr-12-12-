import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../models/dkg_file.dart';
import '../engine/golem_mixer.dart';

/// Canvas widget for rendering DKG frames with physics
class DKGCanvas extends StatelessWidget {
  final DKGFile? dkg;
  final EngineState state;

  const DKGCanvas({
    super.key,
    required this.dkg,
    required this.state,
  });

  @override
  Widget build(BuildContext context) {
    if (dkg == null || state.currentFrame == null) {
      return const Center(
        child: Text(
          'No DKG loaded',
          style: TextStyle(
            fontFamily: 'Rajdhani',
            color: Colors.white54,
            fontSize: 18,
          ),
        ),
      );
    }

    return CustomPaint(
      painter: _DKGPainter(
        atlas: dkg!.atlas,
        frame: state.currentFrame!,
        physics: state.physics,
      ),
      size: Size.infinite,
    );
  }
}

class _DKGPainter extends CustomPainter {
  final ui.Image atlas;
  final FrameData frame;
  final PhysicsState physics;

  _DKGPainter({
    required this.atlas,
    required this.frame,
    required this.physics,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Calculate center position
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    // Calculate frame size (fit to canvas while maintaining aspect ratio)
    final frameAspect = frame.w / frame.h;
    final canvasAspect = size.width / size.height;

    double renderWidth, renderHeight;
    if (frameAspect > canvasAspect) {
      renderWidth = size.width * 0.8;
      renderHeight = renderWidth / frameAspect;
    } else {
      renderHeight = size.height * 0.8;
      renderWidth = renderHeight * frameAspect;
    }

    // Apply scale
    renderWidth *= physics.scale;
    renderHeight *= physics.scale;

    // Apply squash/stretch
    renderWidth *= physics.stretch;
    renderHeight *= physics.squash;

    // Calculate position with physics offset
    final offsetX = centerX + physics.x * size.width * 0.5;
    final offsetY = centerY + physics.y * size.height * 0.5;

    // Save canvas state
    canvas.save();

    // Apply transformations
    canvas.translate(offsetX, offsetY);
    canvas.rotate(physics.rotation);

    // Source rectangle from atlas
    final srcRect = Rect.fromLTWH(
      frame.x.toDouble(),
      frame.y.toDouble(),
      frame.w.toDouble(),
      frame.h.toDouble(),
    );

    // Destination rectangle
    final dstRect = Rect.fromCenter(
      center: Offset.zero,
      width: renderWidth,
      height: renderHeight,
    );

    // Create paint with alpha and color adjustments
    final paint = Paint()
      ..filterQuality = FilterQuality.medium
      ..isAntiAlias = true;

    // Apply alpha
    if (physics.alpha < 1) {
      paint.color = Color.fromRGBO(255, 255, 255, physics.alpha);
    }

    // Apply color matrix for brightness/saturation/hue
    if (physics.brightness != 1 ||
        physics.saturation != 1 ||
        physics.hueShift != 0) {
      paint.colorFilter = _buildColorFilter(
        brightness: physics.brightness,
        saturation: physics.saturation,
        hueShift: physics.hueShift,
      );
    }

    // Draw the frame
    canvas.drawImageRect(atlas, srcRect, dstRect, paint);

    // Restore canvas state
    canvas.restore();
  }

  ColorFilter _buildColorFilter({
    required double brightness,
    required double saturation,
    required double hueShift,
  }) {
    // Simplified color matrix for brightness and saturation
    // Full implementation would include proper hue rotation matrix
    final b = brightness;
    final s = saturation;
    final lumR = 0.3086 * (1 - s);
    final lumG = 0.6094 * (1 - s);
    final lumB = 0.0820 * (1 - s);

    return ColorFilter.matrix(<double>[
      (lumR + s) * b, lumG * b, lumB * b, 0, 0,
      lumR * b, (lumG + s) * b, lumB * b, 0, 0,
      lumR * b, lumG * b, (lumB + s) * b, 0, 0,
      0, 0, 0, 1, 0,
    ]);
  }

  @override
  bool shouldRepaint(covariant _DKGPainter oldDelegate) {
    return oldDelegate.frame != frame ||
        oldDelegate.physics.x != physics.x ||
        oldDelegate.physics.y != physics.y ||
        oldDelegate.physics.scale != physics.scale ||
        oldDelegate.physics.rotation != physics.rotation ||
        oldDelegate.physics.alpha != physics.alpha ||
        oldDelegate.physics.brightness != physics.brightness;
  }
}

/// Background visualizer canvas (simplified quantum foam)
class BackgroundCanvas extends StatelessWidget {
  final double hue;
  final double energy;

  const BackgroundCanvas({
    super.key,
    this.hue = 270,
    this.energy = 0,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _BackgroundPainter(hue: hue, energy: energy),
      size: Size.infinite,
    );
  }
}

class _BackgroundPainter extends CustomPainter {
  final double hue;
  final double energy;

  _BackgroundPainter({required this.hue, required this.energy});

  @override
  void paint(Canvas canvas, Size size) {
    // Dark gradient background
    final gradient = RadialGradient(
      center: Alignment.center,
      radius: 1.2,
      colors: [
        HSVColor.fromAHSV(1, hue, 0.8, 0.15 + energy * 0.1).toColor(),
        HSVColor.fromAHSV(1, hue + 30, 0.9, 0.05).toColor(),
        Colors.black,
      ],
      stops: const [0.0, 0.5, 1.0],
    );

    final paint = Paint()
      ..shader = gradient.createShader(
        Rect.fromLTWH(0, 0, size.width, size.height),
      );

    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      paint,
    );

    // Add some noise/particle effect based on energy
    if (energy > 0.1) {
      final particlePaint = Paint()
        ..color = HSVColor.fromAHSV(energy * 0.3, hue, 1, 1).toColor()
        ..strokeWidth = 1;

      // Simple particle effect
      for (int i = 0; i < (energy * 50).toInt(); i++) {
        final x = (i * 73) % size.width;
        final y = (i * 97) % size.height;
        canvas.drawCircle(Offset(x, y), 1 + energy, particlePaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _BackgroundPainter oldDelegate) {
    return oldDelegate.hue != hue || oldDelegate.energy != energy;
  }
}
