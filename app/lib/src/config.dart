/// Runtime configuration for the app.
///
/// Override at build/run time with:
///   flutter run --dart-define=API_BASE_URL=https://api.example.com
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );
}
