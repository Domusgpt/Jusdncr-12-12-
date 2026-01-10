import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../models/atlas.dart';

class DKGCanvas extends StatefulWidget {
  const DKGCanvas({
    super.key,
    this.atlas,
    this.frameName,
    this.zoom = 1.0,
    this.mirror = false,
  });

  final DkgAtlas? atlas;
  final String? frameName;
  final double zoom;
  final bool mirror;

  @override
  State<DKGCanvas> createState() => _DKGCanvasState();
}

class _DKGCanvasState extends State<DKGCanvas> {
  ui.Image? _image;

  @override
  void didUpdateWidget(covariant DKGCanvas oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.atlas?.imageBytes != widget.atlas?.imageBytes) {
      _decodeAtlasImage();
    }
  }

  @override
  void initState() {
    super.initState();
    _decodeAtlasImage();
  }

  Future<void> _decodeAtlasImage() async {
    final bytes = widget.atlas?.imageBytes;
    if (bytes == null) return;
    final image = await _decodeImage(bytes);
    if (mounted) {
      setState(() {
        _image = image;
      });
    }
  }

  Future<ui.Image> _decodeImage(List<int> bytes) {
    final completer = Completer<ui.Image>();
    ui.decodeImageFromList(Uint8List.fromList(bytes), completer.complete);
    return completer.future;
  }

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DkgCanvasPainter(
        image: _image,
        frameName: widget.frameName,
        atlas: widget.atlas,
        zoom: widget.zoom,
        mirror: widget.mirror,
      ),
      child: const SizedBox.expand(),
    );
  }
}

class _DkgCanvasPainter extends CustomPainter {
  _DkgCanvasPainter({
    required this.image,
    required this.frameName,
    required this.atlas,
    required this.zoom,
    required this.mirror,
  });

  final ui.Image? image;
  final DkgAtlas? atlas;
  final String? frameName;
  final double zoom;
  final bool mirror;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF050505);
    canvas.drawRect(Offset.zero & size, paint);

    if (image == null || atlas == null || frameName == null) {
      _paintPlaceholder(canvas, size);
      return;
    }

    final frame = atlas!.frames[frameName!];
    if (frame == null) {
      _paintPlaceholder(canvas, size, label: 'Frame not found');
      return;
    }

    final src = frame.frame;
    final dstSize = Size(src.width * zoom, src.height * zoom);
    final dst = Rect.fromCenter(
      center: size.center(Offset.zero),
      width: dstSize.width,
      height: dstSize.height,
    );

    canvas.save();
    if (mirror) {
      canvas.translate(size.width, 0);
      canvas.scale(-1, 1);
    }
    canvas.drawImageRect(image!, src, dst, Paint());
    canvas.restore();
  }

  void _paintPlaceholder(Canvas canvas, Size size, {String label = 'DKG CANVAS'}) {
    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF101010), Color(0xFF1C1C1C)],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, paint);

    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: const TextStyle(
          color: Colors.white54,
          fontSize: 12,
          letterSpacing: 3,
          fontWeight: FontWeight.w600,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    final offset = size.center(Offset.zero) -
        Offset(textPainter.width / 2, textPainter.height / 2);
    textPainter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant _DkgCanvasPainter oldDelegate) {
    return oldDelegate.image != image ||
        oldDelegate.frameName != frameName ||
        oldDelegate.zoom != zoom ||
        oldDelegate.mirror != mirror ||
        oldDelegate.atlas != atlas;
  }
}
