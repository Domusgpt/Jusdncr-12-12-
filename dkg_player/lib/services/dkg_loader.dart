import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive.dart';

import '../models/atlas.dart';
import '../models/dkg_project.dart';

class DkgLoader {
  const DkgLoader();

  Future<DkgBundle> loadBytes(Uint8List bytes) async {
    final archive = ZipDecoder().decodeBytes(bytes);
    final fileMap = <String, ArchiveFile>{};
    for (final file in archive) {
      if (file.isFile) {
        fileMap[file.name] = file;
      }
    }

    final jsonFile = _findJsonFile(fileMap);
    final jsonData = utf8.decode(jsonFile.content as List<int>);
    final decoded = jsonDecode(jsonData) as Map<String, dynamic>;

    final project = DkgProject.fromJson(decoded);
    final atlas = _decodeAtlas(fileMap);

    return DkgBundle(project: project, atlas: atlas);
  }

  ArchiveFile _findJsonFile(Map<String, ArchiveFile> fileMap) {
    final preferred = ['project.json', 'manifest.json', 'dkg.json'];
    for (final name in preferred) {
      if (fileMap.containsKey(name)) {
        return fileMap[name]!;
      }
    }
    final fallback = fileMap.entries
        .firstWhere((entry) => entry.key.endsWith('.json'))
        .value;
    return fallback;
  }

  DkgAtlas _decodeAtlas(Map<String, ArchiveFile> fileMap) {
    final atlasJsonFile = fileMap['atlas.json'];
    final imageFile = fileMap.entries.firstWhere(
      (entry) => entry.key.toLowerCase().endsWith('.png'),
      orElse: () => fileMap.entries.firstWhere(
        (entry) => entry.key.toLowerCase().endsWith('.jpg'),
      ),
    );

    if (atlasJsonFile == null) {
      return DkgAtlas(imageBytes: imageFile.value.content as List<int>, frames: {});
    }

    final atlasJson = utf8.decode(atlasJsonFile.content as List<int>);
    final decoded = jsonDecode(atlasJson) as Map<String, dynamic>;
    final frames = <String, AtlasFrame>{};

    final framesJson = decoded['frames'];
    if (framesJson is Map<String, dynamic>) {
      framesJson.forEach((key, value) {
        if (value is Map<String, dynamic>) {
          frames[key] = AtlasFrame.fromJson(key, value);
        }
      });
    } else if (framesJson is List) {
      for (final entry in framesJson) {
        if (entry is Map<String, dynamic>) {
          final filename = entry['filename'] as String? ?? entry['name'] as String?;
          if (filename != null) {
            frames[filename] = AtlasFrame.fromJson(filename, entry);
          }
        }
      }
    }

    return DkgAtlas(
      imageBytes: imageFile.value.content as List<int>,
      frames: frames,
    );
  }
}
