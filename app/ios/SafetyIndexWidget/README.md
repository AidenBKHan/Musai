# iOS Home Screen Widget

Xcode's widget extension target (`project.pbxproj`, entitlements, Info.plist)
can't be generated reliably outside Xcode, so this directory only holds the
widget's SwiftUI source as a reference. To wire it up on macOS:

1. Open `app/ios/Runner.xcworkspace` in Xcode.
2. File → New → Target → **Widget Extension**, name it `SafetyIndexWidget`.
3. Replace the generated `SafetyIndexWidget.swift` with the one in this
   directory.
4. Add an **App Group** capability to both the `Runner` and
   `SafetyIndexWidget` targets, using the same identifier as
   `appGroupId` in `SafetyIndexWidget.swift` (`group.com.musai.musaiApp`).
5. In `ios/Runner/Info.plist`, no changes are needed — `home_widget` reads
   the App Group via the identifier passed from Dart
   (see `HomeWidget.setAppGroupId` in `home_widget`'s iOS docs).
6. Build once on a real Apple ID / team to let Xcode provision the App Group.
