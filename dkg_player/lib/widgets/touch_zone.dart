import 'package:flutter/material.dart';
import '../engine/golem_mixer.dart';

/// Touch zone controller - left half = PATTERN, right half = KINETIC
class TouchZone extends StatefulWidget {
  final Function(EngineMode mode) onModeChange;
  final Function(double x, double y) onTouchMove;
  final Function() onTouchEnd;
  final EngineMode currentMode;

  const TouchZone({
    super.key,
    required this.onModeChange,
    required this.onTouchMove,
    required this.onTouchEnd,
    required this.currentMode,
  });

  @override
  State<TouchZone> createState() => _TouchZoneState();
}

class _TouchZoneState extends State<TouchZone> {
  bool _isTouching = false;
  Offset _touchStart = Offset.zero;
  Offset _touchCurrent = Offset.zero;

  void _handlePanStart(DragStartDetails details) {
    setState(() {
      _isTouching = true;
      _touchStart = details.localPosition;
      _touchCurrent = details.localPosition;
    });

    // Determine mode based on touch side
    final width = context.size?.width ?? 0;
    final isLeft = details.localPosition.dx < width / 2;
    widget.onModeChange(isLeft ? EngineMode.pattern : EngineMode.kinetic);
  }

  void _handlePanUpdate(DragUpdateDetails details) {
    setState(() {
      _touchCurrent = details.localPosition;
    });

    // Calculate normalized position relative to touch start
    final size = context.size ?? Size.zero;
    final dx = (_touchCurrent.dx - _touchStart.dx) / (size.width / 2);
    final dy = (_touchCurrent.dy - _touchStart.dy) / (size.height / 2);
    widget.onTouchMove(dx.clamp(-1.0, 1.0), dy.clamp(-1.0, 1.0));
  }

  void _handlePanEnd(DragEndDetails details) {
    setState(() {
      _isTouching = false;
    });
    widget.onTouchEnd();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: _handlePanStart,
      onPanUpdate: _handlePanUpdate,
      onPanEnd: _handlePanEnd,
      child: Container(
        color: Colors.transparent,
        child: Stack(
          children: [
            // Zone divider
            Positioned.fill(
              child: Row(
                children: [
                  // Left zone (PATTERN)
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border(
                          right: BorderSide(
                            color: Colors.white.withOpacity(0.1),
                            width: 1,
                          ),
                        ),
                      ),
                      child: _isTouching && widget.currentMode == EngineMode.pattern
                          ? _buildZoneHighlight('PATTERN', const Color(0xFF00FFFF))
                          : null,
                    ),
                  ),
                  // Right zone (KINETIC)
                  Expanded(
                    child: Container(
                      child: _isTouching && widget.currentMode == EngineMode.kinetic
                          ? _buildZoneHighlight('KINETIC', const Color(0xFFFF00FF))
                          : null,
                    ),
                  ),
                ],
              ),
            ),

            // Zone labels (shown when not touching)
            if (!_isTouching) ...[
              Positioned(
                left: 16,
                bottom: 16,
                child: _buildLabel('PATTERN', const Color(0xFF00FFFF)),
              ),
              Positioned(
                right: 16,
                bottom: 16,
                child: _buildLabel('KINETIC', const Color(0xFFFF00FF)),
              ),
            ],

            // Touch indicator
            if (_isTouching)
              Positioned(
                left: _touchStart.dx - 40,
                top: _touchStart.dy - 40,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: widget.currentMode == EngineMode.pattern
                          ? const Color(0xFF00FFFF)
                          : const Color(0xFFFF00FF),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: widget.currentMode == EngineMode.pattern
                            ? const Color(0xFF00FFFF)
                            : const Color(0xFFFF00FF),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildZoneHighlight(String label, Color color) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            color.withOpacity(0.1),
            color.withOpacity(0.05),
          ],
        ),
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Rajdhani',
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: color.withOpacity(0.5),
            letterSpacing: 4,
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'Rajdhani',
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color.withOpacity(0.7),
          letterSpacing: 2,
        ),
      ),
    );
  }
}
