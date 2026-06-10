import SwiftUI

@main
struct VoiceMemoBotApp: App {
    @State private var selectedTab = 0

    var body: some Scene {
        WindowGroup {
            // Feed-first, like the phone app's home screen: the feed lands
            // first and Create is one swipe (or one tap on the + card) away.
            TabView(selection: $selectedTab) {
                NavigationStack {
                    FeedView(openCreate: { selectedTab = 1 })
                }
                .tag(0)
                NavigationStack {
                    RecordView()
                }
                .tag(1)
            }
            .tabViewStyle(.verticalPage)
        }
    }
}
