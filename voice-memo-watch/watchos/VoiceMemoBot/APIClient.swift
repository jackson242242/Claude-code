import Foundation

enum APIError: Error {
    case badResponse
}

/// URLSession client for the VoiceMemoBot backend. The backend serializes
/// camelCase JSON, so the default JSONDecoder maps straight onto Models.swift.
struct APIClient {
    var baseURL = AppConfig.apiBaseURL

    func fetchStyles() async throws -> [Style] {
        try await get([Style].self, path: "/styles")
    }

    func uploadMemo(fileURL: URL) async throws -> Memo {
        let boundary = "vmb-\(UUID().uuidString)"
        var request = URLRequest(url: baseURL.appendingPathComponent("/memos"))
        request.httpMethod = "POST"
        request.setValue(
            "multipart/form-data; boundary=\(boundary)",
            forHTTPHeaderField: "Content-Type"
        )

        var body = Data()
        body.append("--\(boundary)\r\n")
        body.append(
            "Content-Disposition: form-data; name=\"file\"; filename=\"memo.m4a\"\r\n"
        )
        body.append("Content-Type: audio/mp4\r\n\r\n")
        body.append(try Data(contentsOf: fileURL))
        body.append("\r\n--\(boundary)--\r\n")

        let (data, response) = try await URLSession.shared.upload(
            for: request, from: body
        )
        try Self.ensureSuccess(response)
        return try JSONDecoder().decode(Memo.self, from: data)
    }

    func renderMemo(memoId: String, style: String) async throws -> Render {
        var request = URLRequest(
            url: baseURL.appendingPathComponent("/memos/\(memoId)/renders")
        )
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["style": style])
        let (data, response) = try await URLSession.shared.data(for: request)
        try Self.ensureSuccess(response)
        return try JSONDecoder().decode(Render.self, from: data)
    }

    private func get<T: Decodable>(_ type: T.Type, path: String) async throws -> T {
        let (data, response) = try await URLSession.shared.data(
            from: baseURL.appendingPathComponent(path)
        )
        try Self.ensureSuccess(response)
        return try JSONDecoder().decode(type, from: data)
    }

    private static func ensureSuccess(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode)
        else { throw APIError.badResponse }
    }
}

private extension Data {
    mutating func append(_ string: String) {
        append(Data(string.utf8))
    }
}
