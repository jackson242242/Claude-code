import Foundation

// These Codable types map 1:1 onto the backend's camelCase JSON contract.

struct Style: Codable, Identifiable, Hashable {
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

struct Render: Codable, Identifiable {
    let id: String
    let memoId: String
    let style: String
    let status: String
    let fileUrl: String
    let shareUrl: String
    let createdAt: String
}
