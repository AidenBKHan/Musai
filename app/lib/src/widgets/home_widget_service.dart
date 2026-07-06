import 'package:home_widget/home_widget.dart';

import '../models/safety_index.dart';

/// Bridges data from the Flutter app to the native home-screen widgets
/// (Android App Widget / iOS WidgetKit) via shared storage.
///
/// The native widget code (Kotlin/SwiftUI) reads the same keys through
/// `HomeWidget` app group / shared preferences and renders its own UI —
/// no Flutter engine runs inside the widget itself.
class HomeWidgetService {
  static const _androidWidgetName = 'SafetyIndexWidgetProvider';
  static const _iOSWidgetKind = 'SafetyIndexWidget';
  static const _iOSAppGroupId = 'group.com.musai.musaiApp';

  static Future<void> pushSafetyIndex(SafetyIndex index) async {
    await HomeWidget.setAppGroupId(_iOSAppGroupId);
    await HomeWidget.saveWidgetData<String>('country_name', index.countryName);
    await HomeWidget.saveWidgetData<String>('region_name', index.regionName ?? '');
    await HomeWidget.saveWidgetData<double>('score', index.score);
    await HomeWidget.saveWidgetData<String>(
      'updated_at',
      index.updatedAt.toIso8601String(),
    );
    await HomeWidget.saveWidgetData<String>('source_name', index.sourceName);

    await HomeWidget.updateWidget(
      androidName: _androidWidgetName,
      iOSName: _iOSWidgetKind,
    );
  }
}
