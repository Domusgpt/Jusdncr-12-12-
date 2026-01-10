import 'atlas.dart';
import 'generated_frame.dart';

enum SubjectCategory { character, text, symbol }

SubjectCategory subjectCategoryFromString(String? value) {
  switch (value) {
    case 'TEXT':
      return SubjectCategory.text;
    case 'SYMBOL':
      return SubjectCategory.symbol;
    case 'CHARACTER':
    default:
      return SubjectCategory.character;
  }
}

class DkgProject {
  DkgProject({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.frames,
    required this.subjectCategory,
    this.hologramParams,
  });

  final String id;
  final String name;
  final int createdAt;
  final List<GeneratedFrame> frames;
  final SubjectCategory subjectCategory;
  final Map<String, dynamic>? hologramParams;

  factory DkgProject.fromJson(Map<String, dynamic> json) {
    final framesJson = (json['frames'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
    return DkgProject(
      id: json['id'] as String? ?? 'unknown',
      name: json['name'] as String? ?? 'Untitled',
      createdAt: (json['createdAt'] as num?)?.toInt() ?? 0,
      frames: framesJson
          .map((entry) => GeneratedFrame.fromJson(entry))
          .toList(),
      subjectCategory: subjectCategoryFromString(
        json['subjectCategory'] as String?,
      ),
      hologramParams: json['hologramParams'] as Map<String, dynamic>?,
    );
  }
}

class DkgBundle {
  DkgBundle({
    required this.project,
    required this.atlas,
  });

  final DkgProject project;
  final DkgAtlas atlas;
}
