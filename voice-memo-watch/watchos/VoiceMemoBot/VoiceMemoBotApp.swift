import SwiftUI

@main
struct VoiceMemoBotApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                NavigationStack {
                    RecordView()
                }
                NavigationStack {
                    FeedView()
                }
            }
            .tabViewStyle(.verticalPage)
        }
    }
}
