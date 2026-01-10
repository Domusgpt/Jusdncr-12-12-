import 'dart:typed_data';
import 'dart:ui' as ui;

/// Energy levels for frames
enum EnergyLevel { low, mid, high }

/// Frame types
enum FrameType { body, closeup, hands, feet, mandala, acrobatic }

/// Movement directions
enum MoveDirection { left, right, center }

/// Subject category
enum SubjectCategory { character, text, symbol }

/// Metadata from meta.json
class DKGMeta {
  final String version;
  final String name;
  final SubjectCategory category;
  final DateTime created;
  final String generator;
  final int frameCount;

  DKGMeta({
    required this.version,
    required this.name,
    required this.category,
    required this.created,
    required this.generator,
    required this.frameCount,
  });

  factory DKGMeta.fromJson(Map<String, dynamic> json) {
    return DKGMeta(
      version: json['version'] ?? '1.0',
      name: json['name'] ?? 'Untitled',
      category: _parseCategory(json['category']),
      created: DateTime.tryParse(json['created'] ?? '') ?? DateTime.now(),
      generator: json['generator'] ?? 'unknown',
      frameCount: json['frameCount'] ?? 0,
    );
  }

  static SubjectCategory _parseCategory(String? cat) {
    switch (cat?.toUpperCase()) {
      case 'TEXT':
        return SubjectCategory.text;
      case 'SYMBOL':
        return SubjectCategory.symbol;
      default:
        return SubjectCategory.character;
    }
  }
}

/// Single frame metadata from manifest.json
class FrameData {
  final String pose;
  final EnergyLevel energy;
  final FrameType type;
  final MoveDirection direction;
  final String role;
  final int x;
  final int y;
  final int w;
  final int h;

  FrameData({
    required this.pose,
    required this.energy,
    required this.type,
    required this.direction,
    required this.role,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
  });

  factory FrameData.fromJson(Map<String, dynamic> json) {
    return FrameData(
      pose: json['pose'] ?? 'idle',
      energy: _parseEnergy(json['energy']),
      type: _parseType(json['type']),
      direction: _parseDirection(json['direction']),
      role: json['role'] ?? 'base',
      x: json['x'] ?? 0,
      y: json['y'] ?? 0,
      w: json['w'] ?? 256,
      h: json['h'] ?? 256,
    );
  }

  static EnergyLevel _parseEnergy(String? e) {
    switch (e?.toLowerCase()) {
      case 'low':
        return EnergyLevel.low;
      case 'high':
        return EnergyLevel.high;
      default:
        return EnergyLevel.mid;
    }
  }

  static FrameType _parseType(String? t) {
    switch (t?.toLowerCase()) {
      case 'closeup':
        return FrameType.closeup;
      case 'hands':
        return FrameType.hands;
      case 'feet':
        return FrameType.feet;
      case 'mandala':
        return FrameType.mandala;
      case 'acrobatic':
        return FrameType.acrobatic;
      default:
        return FrameType.body;
    }
  }

  static MoveDirection _parseDirection(String? d) {
    switch (d?.toLowerCase()) {
      case 'left':
        return MoveDirection.left;
      case 'right':
        return MoveDirection.right;
      default:
        return MoveDirection.center;
    }
  }
}

/// Manifest from manifest.json
class DKGManifest {
  final int atlasWidth;
  final int atlasHeight;
  final int cellSize;
  final List<FrameData> frames;

  DKGManifest({
    required this.atlasWidth,
    required this.atlasHeight,
    required this.cellSize,
    required this.frames,
  });

  factory DKGManifest.fromJson(Map<String, dynamic> json) {
    final framesList = (json['frames'] as List? ?? [])
        .map((f) => FrameData.fromJson(f as Map<String, dynamic>))
        .toList();

    return DKGManifest(
      atlasWidth: json['atlasWidth'] ?? 2048,
      atlasHeight: json['atlasHeight'] ?? 2048,
      cellSize: json['cellSize'] ?? 256,
      frames: framesList,
    );
  }
}

/// Complete loaded DKG file
class DKGFile {
  final DKGMeta meta;
  final DKGManifest manifest;
  final ui.Image atlas;
  final String filePath;

  // Frame pools for quick access
  late final List<FrameData> lowFrames;
  late final List<FrameData> midFrames;
  late final List<FrameData> highFrames;
  late final List<FrameData> closeups;
  late final List<FrameData> leftFrames;
  late final List<FrameData> rightFrames;

  DKGFile({
    required this.meta,
    required this.manifest,
    required this.atlas,
    required this.filePath,
  }) {
    // Build frame pools
    lowFrames = manifest.frames.where((f) => f.energy == EnergyLevel.low).toList();
    midFrames = manifest.frames.where((f) => f.energy == EnergyLevel.mid).toList();
    highFrames = manifest.frames.where((f) => f.energy == EnergyLevel.high).toList();
    closeups = manifest.frames.where((f) => f.type == FrameType.closeup).toList();
    leftFrames = manifest.frames.where((f) => f.direction == MoveDirection.left).toList();
    rightFrames = manifest.frames.where((f) => f.direction == MoveDirection.right).toList();
  }

  /// Get frames by energy level
  List<FrameData> getFramesByEnergy(EnergyLevel energy) {
    switch (energy) {
      case EnergyLevel.low:
        return lowFrames;
      case EnergyLevel.mid:
        return midFrames;
      case EnergyLevel.high:
        return highFrames;
    }
  }

  /// Get a random frame from a pool
  FrameData? getRandomFrame(List<FrameData> pool) {
    if (pool.isEmpty) return null;
    return pool[(DateTime.now().millisecondsSinceEpoch) % pool.length];
  }
}
