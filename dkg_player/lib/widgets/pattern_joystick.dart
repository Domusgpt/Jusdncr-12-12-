import 'dart:math';
import 'package:flutter/material.dart';
import '../engine/golem_mixer.dart';

/// Radial pattern selector joystick - matches web player exactly
class PatternJoystick extends StatefulWidget {
  final Function(PatternType pattern) onPatternSelect;
  final PatternType currentPattern;
  final bool visible;
  final Offset position;
  final bool isKineticMode;

  const PatternJoystick({
    super.key,
    required this.onPatternSelect,
    required this.currentPattern,
    this.visible = false,
    this.position = Offset.zero,
    this.isKineticMode = false,
  });

  @override
  State<PatternJoystick> createState() => _PatternJoystickState();
}

class _PatternJoystickState extends State<PatternJoystick>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnim;

  int _hoveredIndex = -1;
  static const double _ringSize = 160;
  static const double _knobSize = 44;

  // All 15 patterns (PATTERN mode uses all, KINETIC uses subset)
  static const List<PatternType> _allPatterns = PatternType.values;
  static const List<PatternType> _kineticPatterns = [
    PatternType.pingPong,
    PatternType.flow,
    PatternType.stutter,
    PatternType.chaos,
    PatternType.vogue,
    PatternType.buildDrop,
  ];

  List<PatternType> get _activePatterns =>
      widget.isKineticMode ? _kineticPatterns : _allPatterns;

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
    final center = Offset(_ringSize / 2, _ringSize / 2);
    final delta = details.localPosition - center;
    final distance = delta.distance;

    if (distance > _knobSize) {
      final angle = atan2(delta.dy, delta.dx);
      final normalizedAngle = (angle + pi) / (2 * pi);
      final index = (normalizedAngle * _activePatterns.length).floor() %
          _activePatterns.length;

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
    if (_hoveredIndex >= 0 && _hoveredIndex < _activePatterns.length) {
      widget.onPatternSelect(_activePatterns[_hoveredIndex]);
    }
    setState(() {
      _hoveredIndex = -1;
    });
  }

  String _getPatternLabel(PatternType pattern) {
    return GolemMixer.patternNames[pattern.index].substring(0, min(4, GolemMixer.patternNames[pattern.index].length));
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.visible) return const SizedBox.shrink();

    final accentColor = widget.isKineticMode
        ? const Color(0xFFFF00FF)  // Magenta for KINETIC
        : const Color(0xFF00FFFF); // Cyan for PATTERN

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
                patterns: _activePatterns,
                currentPattern: widget.currentPattern,
                hoveredIndex: _hoveredIndex,
                accentColor: accentColor,
                getLabel: _getPatternLabel,
              ),
              child: Center(
                child: Container(
                  width: _knobSize,
                  height: _knobSize,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        accentColor,
                        accentColor.withOpacity(0.7),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: accentColor.withOpacity(0.5),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      _getPatternLabel(widget.currentPattern),
                      style: const TextStyle(
                        fontFamily: 'Rajdhani',
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Colors.black,
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
  final Color accentColor;
  final String Function(PatternType) getLabel;

  _JoystickPainter({
    required this.patterns,
    required this.currentPattern,
    required this.hoveredIndex,
    required this.accentColor,
    required this.getLabel,
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
            ? accentColor.withOpacity(0.6)
            : isSelected
                ? accentColor.withOpacity(0.4)
                : Colors.white.withOpacity(0.15)
        ..style = PaintingStyle.stroke
        ..strokeWidth = isHovered ? 20 : isSelected ? 16 : 12;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 20),
        startAngle,
        segmentAngle * 0.85,
        false,
        segmentPaint,
      );

      // Draw pattern label
      final labelAngle = startAngle + segmentAngle / 2;
      final labelRadius = radius - 38;
      final labelPos = Offset(
        center.dx + cos(labelAngle) * labelRadius,
        center.dy + sin(labelAngle) * labelRadius,
      );

      final textPainter = TextPainter(
        text: TextSpan(
          text: getLabel(patterns[i]),
          style: TextStyle(
            fontFamily: 'Rajdhani',
            fontSize: 9,
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
