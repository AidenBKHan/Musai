import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:musai_app/main.dart';

void main() {
  testWidgets('HomeScreen renders search field', (WidgetTester tester) async {
    await tester.pumpWidget(const MusaiApp());

    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('Musai · 글로벌 안전지수'), findsOneWidget);
  });
}
