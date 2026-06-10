import SwiftUI

/// VoiceMemoBot's own social feed on the watch: browse the latest remixes
/// and like them with one tap. Playback happens on the web/permalink page;
/// the watch keeps the feed glanceable.
struct FeedView: View {
    private let api = APIClient()
    @State private var posts: [Post] = []
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let errorMessage {
                Text(errorMessage).font(.footnote).foregroundStyle(.red)
            } else if posts.isEmpty {
                Text("No remixes posted yet")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                List(posts) { post in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(post.author).font(.caption).bold()
                            Spacer()
                            Text(post.style)
                                .font(.caption2)
                                .foregroundStyle(.purple)
                        }
                        if !post.caption.isEmpty {
                            Text(post.caption).font(.caption2)
                        }
                        Button {
                            Task { await like(post) }
                        } label: {
                            Label("\(post.likes)", systemImage: "heart.fill")
                                .font(.caption2)
                        }
                        .buttonStyle(.borderless)
                        .tint(.pink)
                    }
                }
            }
        }
        .navigationTitle("Feed")
        .task { await refresh() }
        .refreshable { await refresh() }
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
