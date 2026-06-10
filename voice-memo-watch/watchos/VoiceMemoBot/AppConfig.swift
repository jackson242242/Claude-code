import Foundation

enum AppConfig {
    /// Base URL of the VoiceMemoBot backend. For simulator testing point this
    /// at your dev machine (e.g. http://192.168.x.x:8000); in production at
    /// the deployed API. Must be HTTPS for App Store builds (ATS).
    static let apiBaseURL = URL(string: "http://localhost:8000")!

    /// Display name used when posting to the feed. Real accounts/auth are a
    /// production concern; the prototype uses a fixed handle on the watch.
    static let authorHandle = "watch-user"
}
