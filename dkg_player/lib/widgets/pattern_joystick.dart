import 'dart:math';
import 'package:flutter/material.dart';
import '../engine/golem_mixer.dart';

/// Radial pattern selector joystick
class PatternJoystick extends StatefulWidget {
  final Function(PatternType pattern) onPatternSelect;
  final PatternType currentPattern;
  final bool visible;
  final Offset position;

  const PatternJoystick({
    super.key,
    required this.onPatternSelect,
    required this.currentPattern,
    this.visible = false,
    this.position = Offset.zero,
  });

  @override
  State<PatternJoystick> createState() => _PatternJoystickState();
}

class _PatternJoystickState extends State<PatternJoystick>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnim;

  int _hoveredIndex = -1;
  static const double _ringSize = 140;
  static const double _knobSize = 40;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );
  }

  @override
  void didUpdateWidget(PatternJoystick oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.visible && !oldWidget.visible) {
      _animController.forward();
    } else if (!widget.visible && oldWidget.visible) {
      _animController.reverse();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _handlePanUpdate(DragUpdateDetails details) {
    // Calculate angle from center
    final center = Offset(_ringSize / 2, _ringSize / 2);
    final delta = details.localPosition - center;
    final angle = atan2(delta.dy, delta.dx);
    final distance = delta.distance;

    // Only select if dragged far enough from center
    if (distance > _knobSize) {
      // Map angle to pattern index (15 patterns around the ring)
      final normalizedAngle = (angle + pi) / (2 * pi);
      final index = (normalizedAngle * PatternType.values.length).floor() %
          PatternType.values.length;

      setState(() {
        _hoveredIndex = index;
      });
    } else {
      setState(() {
        _hoveredIndex = -1;
      });
    }
  }

  void _handlePanEnd(DragEndDetails details) {
    if (_hoveredIndex >= 0 && _hoveredIndex < PatternType.values.length) {
      widget.onPatternSelect(PatternType.values[_hoveredIndex]);
    }
    setState(() {
      _hoveredIndex = -1;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.visible) return const SizedBox.shrink();

    return Positioned(
      left: widget.position.dx - _ringSize / 2,
      top: widget.position.dy - _ringSize / 2,
      child: ScaleTransition(
        scale: _scaleAnim,
        child: GestureDetector(
          onPanUpdate: _handlePanUpdate,
          onPanEnd: _handlePanEnd,
          child: SizedBox(
            width: _ringSize,
            height: _ringSize,
            child: CustomPaint(
              painter: _JoystickPainter(
                patterns: PatternType.values,
                currentPattern: widget.currentPattern,
                hoveredIndex: _hoveredIndex,
              ),
              child: Center(
                child: Container(
                  width: _knobSize,
                  height: _knobSize,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF8B5CF6),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withOpacity(0.5),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      widget.currentPattern.name[0].toUpperCase(),
                      style: const TextStyle(
                        fontFamily: 'Rajdhani',
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _JoystickPainter extends CustomPainter {
  final List<PatternType> patterns;
  final PatternType currentPattern;
  final int hoveredIndex;

  _JoystickPainter({
    required this.patterns,
    required this.currentPattern,
    required this.hoveredIndex,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Draw outer ring
    final ringPaint = Paint()
      ..color = Colors.white.withOpacity(0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(center, radius - 10, ringPaint);

    // Draw pattern segments
    final segmentAngle = 2 * pi / patterns.length;
    for (int i = 0; i < patterns.length; i++) {
      final startAngle = i * segmentAngle - pi / 2 - segmentAngle / 2;
      final isSelected = patterns[i] == currentPattern;
      final isHovered = i == hoveredIndex;

      // Draw segment arc
      final segmentPaint = Paint()
        ..color = isHovered
            ? const Color(0xFF8B5CF6).withOpacity(0.5)
            : isSelected
                ? const Color(0xFF00FFFF).withOpacity(0.3)
                : Colors.white.withOpacity(0.1)
        ..style = PaintingStyle.stroke
        ..strokeWidth = isHovered ? 20 : isSelected ? 16 : 12;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 20),
        startAngle,
        segmentAngle * 0.8,
        false,
        segmentPaint,
      );

      // Draw pattern label
      final labelAngle = startAngle + segmentAngle / 2;
      final labelRadius = radius - 35;
      final labelPos = Offset(
        center.dx + cos(labelAngle) * labelRadius,
        center.dy + sin(labelAngle) * labelRadius,
      );

      final textPainter = TextPainter(
        text: TextSpan(
          text: patterns[i].name[0].toUpperCase(),
          style: TextStyle(
            fontFamily: 'Rajdhani',
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: isHovered || isSelected
                ? Colors.white
                : Colors.white.withOpacity(0.5),
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        labelPos - Offset(textPainter.width / 2, textPainter.height / 2),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _JoystickPainter oldDelegate) {
    return oldDelegate.currentPattern != currentPattern ||
        oldDelegate.hoveredIndex != hoveredIndex;
  }
}
