import Foundation

enum AppConfig {
    /// Base URL of the VoiceMemoBot backend. For simulator testing point this
    /// at your dev machine (e.g. http://192.168.x.x:8000); in production at
    /// the deployed API. Must be HTTPS for App Store builds (ATS).
    static let apiBaseURL = URL(string: "http://localhost:8000")!
}
