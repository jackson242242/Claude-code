import SwiftUI

/// 2026 trend palette shared across the watch UI — no black surfaces:
/// Pantone "Cloud Dancer" (off-white canvas), WGSN "Transformative Teal"
/// (primary), Coloro "Fuchsia" (energy accent for likes/live).
extension Color {
    static let vmbCloudDancer = Color(red: 0.94, green: 0.93, blue: 0.91)
    static let vmbTeal = Color(red: 0.05, green: 0.49, blue: 0.48)
    static let vmbFuchsia = Color(red: 0.78, green: 0.22, blue: 0.56)
}
