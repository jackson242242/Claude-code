import SwiftUI

@main
struct VoiceMemoBotApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                RecordView()
            }
        }
    }
}
