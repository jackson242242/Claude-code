import SwiftUI

/// VoiceMemoBot's feed as the watch's landing screen, adapted from the
/// phone-style card feed for the small display: a single column of
/// image-dominant cards (gradient cover + caption overlay + byline),
/// with a create button pinned at the top. Playback happens on the
/// web/permalink page; the watch keeps the feed glanceable.
struct FeedView: View {
    let openCreate: () -> Void

    private let api = APIClient()
    @State private var posts: [Post] = []
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                createButton
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(.red)
                } else if posts.isEmpty {
                    Text("No remixes yet — be the first")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding(.top, 12)
                } else {
                    ForEach(posts) { post in
                        PostCard(post: post) {
                            Task { await like(post) }
                        }
                    }
                }
            }
        }
        .navigationTitle("VoiceMemoBot")
        .task { await refresh() }
        .refreshable { await refresh() }
    }

    private var createButton: some View {
        Button(action: openCreate) {
            Label("Create", systemImage: "plus")
                .font(.footnote.bold())
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(Color(red: 1.0, green: 0.14, blue: 0.26))
    }

    private func refresh() async {
        do {
            posts = try await api.fetchFeed()
            errorMessage = nil
        } catch {
            errorMessage = "Could not load the feed"
        }
    }

    private func like(_ post: Post) async {
        guard let updated = try? await api.likePost(postId: post.id),
              let index = posts.firstIndex(where: { $0.id == post.id })
        else { return }
        posts[index] = updated
    }
}

/// One feed card: gradient cover (stable per post), caption overlaid in
/// bold on a bottom scrim, then a compact byline with a one-tap like.
private struct PostCard: View {
    let post: Post
    let onLike: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            cover
            byline
        }
        .background(.quaternary.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var cover: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                colors: coverColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            LinearGradient(
                colors: [.clear, .black.opacity(0.55)],
                startPoint: .center,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: 2) {
                Text(post.style.uppercased())
                    .font(.system(size: 9, weight: .bold))
                    .padding(.horizontal, 5)
                    .padding(.vertical, 1)
                    .background(.black.opacity(0.35), in: Capsule())
                Text(post.caption.isEmpty ? "\(post.style) remix" : post.caption)
                    .font(.caption.bold())
                    .lineLimit(2)
                    .shadow(radius: 2)
            }
            .foregroundStyle(.white)
            .padding(6)
        }
        .frame(height: 64)
    }

    private var byline: some View {
        HStack(spacing: 4) {
            Text(String(post.author.prefix(1)).uppercased())
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 14, height: 14)
                .background(
                    LinearGradient(colors: [.orange, .pink],
                                   startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: Circle()
                )
            Text(post.author)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Spacer()
            Button(action: onLike) {
                Label("\(post.likes)", systemImage: "heart")
                    .font(.system(size: 11))
            }
            .buttonStyle(.borderless)
            .tint(Color(red: 1.0, green: 0.14, blue: 0.26))
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 5)
    }

    /// Deterministic palette from the post id so covers are stable,
    /// mirroring the web prototype's cover generator.
    private var coverColors: [Color] {
        let palettes: [[Color]] = [
            [Color(hue: 0.97, saturation: 0.8, brightness: 0.95),
             Color(hue: 0.07, saturation: 0.85, brightness: 0.95)],
            [Color(hue: 0.57, saturation: 0.8, brightness: 0.92),
             Color(hue: 0.71, saturation: 0.85, brightness: 0.85)],
            [Color(hue: 0.44, saturation: 0.8, brightness: 0.85),
             Color(hue: 0.56, saturation: 0.85, brightness: 0.85)],
            [Color(hue: 0.78, saturation: 0.8, brightness: 0.9),
             Color(hue: 0.93, saturation: 0.85, brightness: 0.95)],
        ]
        var hash = 0
        for scalar in post.id.unicodeScalars {
            hash = (hash &* 31 &+ Int(scalar.value)) & 0x7fffffff
        }
        return palettes[hash % palettes.count]
    }
}
