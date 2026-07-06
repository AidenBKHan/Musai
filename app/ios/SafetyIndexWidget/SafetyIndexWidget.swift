//
//  SafetyIndexWidget.swift
//  Not yet wired into an Xcode target — see app/ios/SafetyIndexWidget/README.md.
//
//  Reads the same App Group UserDefaults keys that
//  lib/src/widgets/home_widget_service.dart writes via the `home_widget`
//  plugin, and renders the global safety index on the iOS home screen.

import SwiftUI
import WidgetKit

private let appGroupId = "group.com.musai.musaiApp"

struct SafetyIndexEntry: TimelineEntry {
  let date: Date
  let countryName: String
  let regionName: String?
  let score: Double
  let sourceName: String
}

struct SafetyIndexProvider: TimelineProvider {
  func placeholder(in context: Context) -> SafetyIndexEntry {
    SafetyIndexEntry(
      date: Date(), countryName: "Seoul", regionName: nil, score: 0, sourceName: "")
  }

  func getSnapshot(in context: Context, completion: @escaping (SafetyIndexEntry) -> Void) {
    completion(readEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SafetyIndexEntry>) -> Void) {
    let timeline = Timeline(entries: [readEntry()], policy: .atEnd)
    completion(timeline)
  }

  private func readEntry() -> SafetyIndexEntry {
    let data = UserDefaults(suiteName: appGroupId)
    return SafetyIndexEntry(
      date: Date(),
      countryName: data?.string(forKey: "country_name") ?? "위치를 선택하세요",
      regionName: data?.string(forKey: "region_name"),
      score: data?.double(forKey: "score") ?? -1,
      sourceName: data?.string(forKey: "source_name") ?? ""
    )
  }
}

struct SafetyIndexWidgetEntryView: View {
  var entry: SafetyIndexProvider.Entry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(entry.regionName.map { "\($0), \(entry.countryName)" } ?? entry.countryName)
        .font(.caption)
        .foregroundColor(.white)
      Text(entry.score >= 0 ? String(format: "%.1f", entry.score) : "--")
        .font(.system(size: 32, weight: .bold))
        .foregroundColor(.white)
      if !entry.sourceName.isEmpty {
        Text("출처: \(entry.sourceName)")
          .font(.system(size: 10))
          .foregroundColor(.white.opacity(0.8))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding()
    .background(Color(red: 0, green: 0.475, blue: 0.42))
  }
}

@main
struct SafetyIndexWidget: Widget {
  let kind: String = "SafetyIndexWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SafetyIndexProvider()) { entry in
      SafetyIndexWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Musai 안전지수")
    .description("선택한 지역의 글로벌 안전지수를 홈 화면에서 확인하세요.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
