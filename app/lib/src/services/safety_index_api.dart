import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/safety_index.dart';

class SafetyIndexApi {
  final http.Client _client;

  SafetyIndexApi({http.Client? client}) : _client = client ?? http.Client();

  Future<SafetyIndex> fetchByCountry(String countryCode) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/v1/safety-index/$countryCode');
    final response = await _client.get(uri);

    if (response.statusCode != 200) {
      throw SafetyIndexApiException(
        'Failed to load safety index for $countryCode (HTTP ${response.statusCode})',
      );
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return SafetyIndex.fromJson(body);
  }

  Future<List<SafetyIndex>> search(String query) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/v1/safety-index')
        .replace(queryParameters: {'q': query});
    final response = await _client.get(uri);

    if (response.statusCode != 200) {
      throw SafetyIndexApiException(
        'Failed to search safety index for "$query" (HTTP ${response.statusCode})',
      );
    }

    final body = jsonDecode(response.body) as List<dynamic>;
    return body
        .map((e) => SafetyIndex.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  void dispose() => _client.close();
}

class SafetyIndexApiException implements Exception {
  final String message;
  SafetyIndexApiException(this.message);

  @override
  String toString() => 'SafetyIndexApiException: $message';
}
