import 'package:flutter/material.dart';

import 'screens/player_screen.dart';

void main() {
  runApp(const DkgPlayerApp());
}

class DkgPlayerApp extends StatelessWidget {
  const DkgPlayerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DKG Player',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF050505),
      ),
      home: const PlayerScreen(),
    );
  }
}
