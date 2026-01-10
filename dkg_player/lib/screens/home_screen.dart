import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/dkg_loader.dart';
import 'player_screen.dart';

/// Home screen with file picker and recent files
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<String> _recentFiles = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRecentFiles();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.storage,
      Permission.microphone,
      Permission.photos,
    ].request();
  }

  Future<void> _loadRecentFiles() async {
    final recent = await DKGLoader.getRecentFiles();
    setState(() {
      _recentFiles = recent;
    });
  }

  Future<void> _pickFile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['dkg', 'zip'],
      );

      if (result != null && result.files.single.path != null) {
        final path = result.files.single.path!;
        await _openDKG(path);
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick file: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _openDKG(String path) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dkg = await DKGLoader.load(path);
      await DKGLoader.addToRecent(path);
      await _loadRecentFiles();

      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => PlayerScreen(dkg: dkg),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load DKG: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              const Text(
                'jusDNCE',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 4,
                ),
              ),
              const Text(
                'DKG PLAYER',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF8B5CF6),
                  letterSpacing: 8,
                ),
              ),
              const SizedBox(height: 48),

              // Open file button
              _buildOpenButton(),
              const SizedBox(height: 24),

              // Error message
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.5)),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(
                      fontFamily: 'Rajdhani',
                      color: Colors.red,
                      fontSize: 14,
                    ),
                  ),
                ),

              const SizedBox(height: 24),

              // Recent files
              const Text(
                'RECENT FILES',
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white54,
                  letterSpacing: 4,
                ),
              ),
              const SizedBox(height: 12),

              Expanded(
                child: _recentFiles.isEmpty
                    ? Center(
                        child: Text(
                          'No recent files',
                          style: TextStyle(
                            fontFamily: 'Rajdhani',
                            color: Colors.white.withOpacity(0.3),
                            fontSize: 16,
                          ),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _recentFiles.length,
                        itemBuilder: (context, index) {
                          final path = _recentFiles[index];
                          final name = path.split('/').last;
                          return _buildRecentItem(name, path);
                        },
                      ),
              ),

              // Version
              const Text(
                'v1.0.0',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Rajdhani',
                  fontSize: 12,
                  color: Colors.white24,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOpenButton() {
    return GestureDetector(
      onTap: _isLoading ? null : _pickFile,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFF8B5CF6).withOpacity(0.3),
            width: 2,
          ),
        ),
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF8B5CF6),
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.folder_open,
                    size: 40,
                    color: const Color(0xFF8B5CF6).withOpacity(0.8),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'OPEN .DKG FILE',
                    style: TextStyle(
                      fontFamily: 'Rajdhani',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF8B5CF6),
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildRecentItem(String name, String path) {
    return GestureDetector(
      onTap: () => _openDKG(path),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.white.withOpacity(0.1),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.animation,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontFamily: 'Rajdhani',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    path,
                    style: TextStyle(
                      fontFamily: 'Rajdhani',
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.4),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: Colors.white24,
            ),
          ],
        ),
      ),
    );
  }
}
