import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:archive/archive.dart';
import 'package:path_provider/path_provider.dart';
import '../models/dkg_file.dart';

/// Service for loading and extracting .dkg files
class DKGLoader {
  /// Load a DKG file from path
  static Future<DKGFile> load(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('DKG file not found: $filePath');
    }

    final bytes = await file.readAsBytes();
    return loadFromBytes(bytes, filePath);
  }

  /// Load a DKG file from bytes (useful for share intents)
  static Future<DKGFile> loadFromBytes(List<int> bytes, String originalPath) async {
    // Decode ZIP archive
    final archive = ZipDecoder().decodeBytes(bytes);

    // Extract files
    DKGMeta? meta;
    DKGManifest? manifest;
    List<int>? atlasBytes;

    for (final file in archive) {
      final filename = file.name.toLowerCase();
      if (file.isFile) {
        if (filename == 'meta.json') {
          final content = utf8.decode(file.content as List<int>);
          meta = DKGMeta.fromJson(jsonDecode(content));
        } else if (filename == 'manifest.json') {
          final content = utf8.decode(file.content as List<int>);
          manifest = DKGManifest.fromJson(jsonDecode(content));
        } else if (filename == 'atlas.webp' || filename == 'atlas.png') {
          atlasBytes = file.content as List<int>;
        }
      }
    }

    if (meta == null) {
      throw Exception('Invalid DKG: missing meta.json');
    }
    if (manifest == null) {
      throw Exception('Invalid DKG: missing manifest.json');
    }
    if (atlasBytes == null) {
      throw Exception('Invalid DKG: missing atlas image');
    }

    // Decode atlas image
    final codec = await ui.instantiateImageCodec(atlasBytes as Uint8List);
    final frame = await codec.getNextFrame();
    final atlas = frame.image;

    return DKGFile(
      meta: meta,
      manifest: manifest,
      atlas: atlas,
      filePath: originalPath,
    );
  }

  /// Get the app's DKG cache directory
  static Future<Directory> getCacheDir() async {
    final appDir = await getApplicationDocumentsDirectory();
    final cacheDir = Directory('${appDir.path}/dkg_cache');
    if (!await cacheDir.exists()) {
      await cacheDir.create(recursive: true);
    }
    return cacheDir;
  }

  /// List recently opened DKG files
  static Future<List<String>> getRecentFiles() async {
    final cacheDir = await getCacheDir();
    final recentFile = File('${cacheDir.path}/recent.json');
    if (!await recentFile.exists()) {
      return [];
    }
    final content = await recentFile.readAsString();
    final list = jsonDecode(content) as List;
    return list.cast<String>();
  }

  /// Add a file to recent list
  static Future<void> addToRecent(String filePath) async {
    final recent = await getRecentFiles();
    recent.remove(filePath);
    recent.insert(0, filePath);
    // Keep only last 20
    final trimmed = recent.take(20).toList();

    final cacheDir = await getCacheDir();
    final recentFile = File('${cacheDir.path}/recent.json');
    await recentFile.writeAsString(jsonEncode(trimmed));
  }
}
