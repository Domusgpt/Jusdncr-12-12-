import 'package:flutter/material.dart';

class TouchZone extends StatefulWidget {
  const TouchZone({
    super.key,
    required this.onChanged,
    this.onRelease,
    this.size = const Size(140, 140),
    this.label = 'TOUCH',
  });

  final ValueChanged<Offset> onChanged;
  final VoidCallback? onRelease;
  final Size size;
  final String label;

  @override
  State<TouchZone> createState() => _TouchZoneState();
}

class _TouchZoneState extends State<TouchZone> {
  Offset _position = Offset.zero;
  bool _active = false;

  void _updatePosition(Offset localPosition, Size size) {
    final normalized = Offset(
      (localPosition.dx / size.width).clamp(0, 1) * 2 - 1,
      (localPosition.dy / size.height).clamp(0, 1) * 2 - 1,
    );
    setState(() {
      _position = normalized;
      _active = true;
    });
    widget.onChanged(normalized);
  }

  void _endGesture() {
    setState(() {
      _position = Offset.zero;
      _active = false;
    });
    widget.onChanged(Offset.zero);
    widget.onRelease?.call();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size.width,
      height: widget.size.height,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return GestureDetector(
            onPanStart: (details) =>
                _updatePosition(details.localPosition, constraints.biggest),
            onPanUpdate: (details) =>
                _updatePosition(details.localPosition, constraints.biggest),
            onPanEnd: (_) => _endGesture(),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _active ? Colors.cyanAccent : Colors.white24,
                ),
                gradient: const LinearGradient(
                  colors: [Color(0xFF0D0D0D), Color(0xFF1D1D1D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Stack(
                children: [
                  Align(
                    alignment: Alignment.topCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        widget.label,
                        style: const TextStyle(
                          fontSize: 10,
                          letterSpacing: 2,
                          color: Colors.white54,
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white30,
                      ),
                    ),
                  ),
                  Align(
                    alignment: Alignment(
                      _position.dx,
                      _position.dy,
                    ),
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _active ? Colors.cyanAccent : Colors.white38,
                        boxShadow: _active
                            ? [
                                BoxShadow(
                                  color: Colors.cyanAccent.withOpacity(0.4),
                                  blurRadius: 12,
                                  spreadRadius: 1,
                                ),
                              ]
                            : null,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
