import Foundation

// These Codable types map 1:1 onto the backend's camelCase JSON contract.

struct Style: Codable, Identifiable, Hashable {
    let id: String
    let label: String
    let description: String
}

struct Instrument: Codable, Identifiable, Hashable {
    let id: String
    let label: String
    let description: String
}

struct Memo: Codable, Identifiable {
    let id: String
    let filename: String
    let contentType: String
    let sizeBytes: Int
    let createdAt: String
}

/// One-click adjustments, always applied to the original memo.
struct Tweaks: Codable, Equatable {
    var speed: Double = 1.0
    var echo: Double = 0.0
    var volume: Double = 1.0
    var reverse: Bool = false
}

struct RenderRequest: Codable {
    let style: String
    let tweaks: Tweaks
    var instruments: [String] = []
    var prompt: String = ""
}

struct Render: Codable, Identifiable {
    let id: String
    let memoId: String
    let style: String
    let tweaks: Tweaks
    let instruments: [String]
    let prompt: String
    let status: String
    let fileUrl: String
    let createdAt: String
}

struct PromptSuggestion: Codable, Identifiable, Hashable {
    let label: String
    let text: String
    var id: String { text }
}

struct PostRequest: Codable {
    let renderId: String
    let author: String
    let caption: String
}

struct Post: Codable, Identifiable {
    let id: String
    let renderId: String
    let style: String
    let author: String
    let caption: String
    let likes: Int
    let fileUrl: String
    let permalink: String
    let createdAt: String
}
