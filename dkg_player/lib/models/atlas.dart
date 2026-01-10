import 'dart:ui';

class AtlasFrame {
  AtlasFrame({
    required this.name,
    required this.frame,
    this.sourceSize,
    this.spriteSourceSize,
  });

  final String name;
  final Rect frame;
  final Size? sourceSize;
  final Rect? spriteSourceSize;

  factory AtlasFrame.fromJson(String name, Map<String, dynamic> json) {
    final frameJson = json['frame'] as Map<String, dynamic>? ?? json;
    final frameRect = Rect.fromLTWH(
      (frameJson['x'] as num?)?.toDouble() ?? 0,
      (frameJson['y'] as num?)?.toDouble() ?? 0,
      (frameJson['w'] as num?)?.toDouble() ?? 0,
      (frameJson['h'] as num?)?.toDouble() ?? 0,
    );

    Size? sourceSize;
    final sourceJson = json['sourceSize'] as Map<String, dynamic>?;
    if (sourceJson != null) {
      sourceSize = Size(
        (sourceJson['w'] as num?)?.toDouble() ?? 0,
        (sourceJson['h'] as num?)?.toDouble() ?? 0,
      );
    }

    Rect? spriteSourceSize;
    final spriteJson = json['spriteSourceSize'] as Map<String, dynamic>?;
    if (spriteJson != null) {
      spriteSourceSize = Rect.fromLTWH(
        (spriteJson['x'] as num?)?.toDouble() ?? 0,
        (spriteJson['y'] as num?)?.toDouble() ?? 0,
        (spriteJson['w'] as num?)?.toDouble() ?? 0,
        (spriteJson['h'] as num?)?.toDouble() ?? 0,
      );
    }

    return AtlasFrame(
      name: name,
      frame: frameRect,
      sourceSize: sourceSize,
      spriteSourceSize: spriteSourceSize,
    );
  }
}

class DkgAtlas {
  DkgAtlas({
    required this.imageBytes,
    required this.frames,
  });

  final List<int> imageBytes;
  final Map<String, AtlasFrame> frames;
}
