import 'dart:async';

import 'package:flutter/material.dart';

/// 打字机效果：逐字打出 → 停留 → 逐字擦除 → 下一句，末尾光标闪烁。
class Typewriter extends StatefulWidget {
  final List<String> phrases;
  final TextStyle? style;

  const Typewriter({super.key, required this.phrases, this.style});

  @override
  State<Typewriter> createState() => _TypewriterState();
}

class _TypewriterState extends State<Typewriter> {
  static const _typeMs = Duration(milliseconds: 110);
  static const _eraseMs = Duration(milliseconds: 45);
  static const _holdMs = Duration(milliseconds: 2200);

  int _phraseIndex = 0;
  int _charCount = 0;
  bool _erasing = false;
  bool _cursorOn = true;
  Timer? _timer;
  Timer? _cursorTimer;

  @override
  void initState() {
    super.initState();
    _cursorTimer = Timer.periodic(const Duration(milliseconds: 550), (_) {
      if (mounted) setState(() => _cursorOn = !_cursorOn);
    });
    _timer = Timer(const Duration(milliseconds: 500), _tick);
  }

  void _tick() {
    if (!mounted) return;
    final phrase = widget.phrases[_phraseIndex];
    if (!_erasing) {
      _charCount += 1;
      setState(() {});
      if (_charCount >= phrase.length) {
        _erasing = true;
        _timer = Timer(_holdMs, _tick);
        return;
      }
      _timer = Timer(_typeMs, _tick);
    } else {
      _charCount -= 1;
      setState(() {});
      if (_charCount <= 0) {
        _erasing = false;
        _phraseIndex = (_phraseIndex + 1) % widget.phrases.length;
        _timer = Timer(const Duration(milliseconds: 350), _tick);
        return;
      }
      _timer = Timer(_eraseMs, _tick);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _cursorTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final phrase = widget.phrases[_phraseIndex];
    final text = phrase.substring(0, _charCount.clamp(0, phrase.length));
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          text,
          style: widget.style,
          textDirection: TextDirection.ltr,
        ),
        Container(
          width: 2.5,
          height: (widget.style?.fontSize ?? 16) * 1.05,
          margin: const EdgeInsets.only(left: 4),
          decoration: BoxDecoration(
            color: _cursorOn ? colorScheme.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ],
    );
  }
}
