import SwiftUI

/// Final step: share the render's public link. Social platforms don't accept
/// direct audio uploads from watchOS, so the link (whose page embeds a player
/// and Open Graph tags) is what gets posted — from the watch via Messages/
/// Mail, or via the full social share sheet when handed off to the iPhone.
struct ShareView: View {
    let render: Render

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "music.note")
                .resizable()
                .scaledToFit()
                .frame(height: 40)
                .foregroundStyle(.accent)
            Text("\(render.style.capitalized) remix ready")
                .font(.headline)
            if let url = URL(string: render.shareUrl) {
                ShareLink(item: url) {
                    Label("Share", systemImage: "square.and.arrow.up")
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .navigationTitle("Share")
    }
}
