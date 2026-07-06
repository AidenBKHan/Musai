class SafetyIndex {
  final String countryCode;
  final String countryName;
  final String? regionName;
  final double score;
  final DateTime updatedAt;
  final List<SafetyIndexFactor> factors;
  final String sourceName;

  const SafetyIndex({
    required this.countryCode,
    required this.countryName,
    this.regionName,
    required this.score,
    required this.updatedAt,
    required this.factors,
    required this.sourceName,
  });

  factory SafetyIndex.fromJson(Map<String, dynamic> json) {
    return SafetyIndex(
      countryCode: json['countryCode'] as String,
      countryName: json['countryName'] as String,
      regionName: json['regionName'] as String?,
      score: (json['score'] as num).toDouble(),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      sourceName: json['sourceName'] as String,
      factors: (json['factors'] as List<dynamic>? ?? [])
          .map((f) => SafetyIndexFactor.fromJson(f as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'countryCode': countryCode,
        'countryName': countryName,
        'regionName': regionName,
        'score': score,
        'updatedAt': updatedAt.toIso8601String(),
        'sourceName': sourceName,
        'factors': factors.map((f) => f.toJson()).toList(),
      };
}

class SafetyIndexFactor {
  final String label;
  final double score;

  const SafetyIndexFactor({required this.label, required this.score});

  factory SafetyIndexFactor.fromJson(Map<String, dynamic> json) {
    return SafetyIndexFactor(
      label: json['label'] as String,
      score: (json['score'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {'label': label, 'score': score};
}
