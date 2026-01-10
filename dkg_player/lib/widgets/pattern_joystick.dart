import 'package:flutter/material.dart';

class PatternJoystick extends StatelessWidget {
  const PatternJoystick({
    super.key,
    required this.patterns,
    required this.selected,
    required this.onSelected,
  });

  final List<String> patterns;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white12),
        gradient: const LinearGradient(
          colors: [Color(0xFF11111A), Color(0xFF1F1F2E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PATTERN JOYSTICK',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 1.5,
              color: Colors.white54,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: patterns.map((pattern) {
              final isActive = pattern == selected;
              return ChoiceChip(
                label: Text(pattern),
                selected: isActive,
                onSelected: (_) => onSelected(pattern),
                labelStyle: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isActive ? Colors.black : Colors.white70,
                ),
                selectedColor: Colors.cyanAccent,
                backgroundColor: Colors.white10,
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            height: 54,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
              color: Colors.black.withOpacity(0.35),
            ),
            child: Center(
              child: Text(
                'MODE: $selected',
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.white70,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
