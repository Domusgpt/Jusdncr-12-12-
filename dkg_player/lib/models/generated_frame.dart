import 'dart:convert';

enum EnergyLevel { low, mid, high }

enum MoveDirection { left, right, center }

enum FrameType { body, closeup, hands, feet, mandala, acrobatic }

enum SheetRole { base, alt, flourish, smooth }

EnergyLevel energyLevelFromString(String? value) {
  switch (value) {
    case 'low':
      return EnergyLevel.low;
    case 'high':
      return EnergyLevel.high;
    case 'mid':
    default:
      return EnergyLevel.mid;
  }
}

MoveDirection? moveDirectionFromString(String? value) {
  switch (value) {
    case 'left':
      return MoveDirection.left;
    case 'right':
      return MoveDirection.right;
    case 'center':
      return MoveDirection.center;
    default:
      return null;
  }
}

FrameType? frameTypeFromString(String? value) {
  switch (value) {
    case 'body':
      return FrameType.body;
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
      return null;
  }
}

SheetRole? sheetRoleFromString(String? value) {
  switch (value) {
    case 'base':
      return SheetRole.base;
    case 'alt':
      return SheetRole.alt;
    case 'flourish':
      return SheetRole.flourish;
    case 'smooth':
      return SheetRole.smooth;
    default:
      return null;
  }
}

String? frameTypeToString(FrameType? value) => value?.name;
String? moveDirectionToString(MoveDirection? value) => value?.name;
String? sheetRoleToString(SheetRole? value) => value?.name;

class GeneratedFrame {
  GeneratedFrame({
    required this.url,
    required this.pose,
    this.energy = EnergyLevel.mid,
    this.type,
    this.role,
    this.direction,
    this.promptUsed,
  });

  final String url;
  final String pose;
  final EnergyLevel energy;
  final FrameType? type;
  final SheetRole? role;
  final MoveDirection? direction;
  final String? promptUsed;

  GeneratedFrame copyWith({
    String? url,
    String? pose,
    EnergyLevel? energy,
    FrameType? type,
    SheetRole? role,
    MoveDirection? direction,
    String? promptUsed,
  }) {
    return GeneratedFrame(
      url: url ?? this.url,
      pose: pose ?? this.pose,
      energy: energy ?? this.energy,
      type: type ?? this.type,
      role: role ?? this.role,
      direction: direction ?? this.direction,
      promptUsed: promptUsed ?? this.promptUsed,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'pose': pose,
      'energy': energy.name,
      'type': frameTypeToString(type),
      'role': sheetRoleToString(role),
      'direction': moveDirectionToString(direction),
      'promptUsed': promptUsed,
    };
  }

  static GeneratedFrame fromJson(Map<String, dynamic> json) {
    return GeneratedFrame(
      url: json['url'] as String? ?? '',
      pose: json['pose'] as String? ?? 'unknown',
      energy: energyLevelFromString(json['energy'] as String?),
      type: frameTypeFromString(json['type'] as String?),
      role: sheetRoleFromString(json['role'] as String?),
      direction: moveDirectionFromString(json['direction'] as String?),
      promptUsed: json['promptUsed'] as String?,
    );
  }

  static List<GeneratedFrame> decodeList(String rawJson) {
    final decoded = jsonDecode(rawJson) as List<dynamic>;
    return decoded
        .map((entry) => GeneratedFrame.fromJson(entry as Map<String, dynamic>))
        .toList();
  }
}
