import SwiftUI

/// The remix result. Every tool that changes the original memo is one tap
/// away: style chips re-render in another vibe, tweak buttons nudge speed/
/// echo/reverse — each tap re-renders from the ORIGINAL memo (tools never
/// stack on a previous render). Posting publishes to VoiceMemoBot's own feed.
struct ResultView: View {
    let memoId: String
    let styles: [Style]
    @State var render: Render

    private let api = APIClient()
    @State private var tweaks = Tweaks()
    @State private var isWorking = false
    @State private var post: Post?
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                if let post {
                    postedConfirmation(post)
                } else {
                    Text("\(render.style.capitalized) remix ready")
                        .font(.headline)
                    styleChips
                    toolGrid
                    Button {
                        Task { await publish() }
                    } label: {
                        Label("Post to Feed", systemImage: "paperplane.fill")
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isWorking)
                }
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Remix")
        .overlay { if isWorking { ProgressView() } }
    }

    private var styleChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                ForEach(styles) { style in
                    Button(style.label) {
                        Task { await rerender(style: style.id) }
                    }
                    .font(.caption2)
                    .buttonStyle(.bordered)
                    .tint(style.id == render.style ? .accentColor : .gray)
                }
            }
        }
    }

    private var toolGrid: some View {
        VStack(spacing: 6) {
            HStack {
                toolButton("tortoise.fill") { tweaks.speed = max(0.5, tweaks.speed - 0.25) }
                toolButton("hare.fill") { tweaks.speed = min(2.0, tweaks.speed + 0.25) }
                toolButton("water.waves") { tweaks.echo = min(1.0, tweaks.echo + 0.25) }
                toolButton(
                    "backward.fill",
                    highlighted: tweaks.reverse
                ) { tweaks.reverse.toggle() }
            }
            if tweaks != Tweaks() {
                Button("Reset tweaks") {
                    tweaks = Tweaks()
                    Task { await rerender(style: render.style) }
                }
                .font(.caption2)
            }
        }
    }

    private func toolButton(
        _ systemImage: String,
        highlighted: Bool = false,
        mutate: @escaping () -> Void
    ) -> some View {
        Button {
            mutate()
            Task { await rerender(style: render.style) }
        } label: {
            Image(systemName: systemImage)
        }
        .buttonStyle(.bordered)
        .tint(highlighted ? .accentColor : .gray)
        .disabled(isWorking)
    }

    private func postedConfirmation(_ post: Post) -> some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .resizable()
                .scaledToFit()
                .frame(height: 36)
                .foregroundStyle(.green)
            Text("Posted to the feed")
                .font(.headline)
            Text("\(post.style.capitalized) · by \(post.author)")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private func rerender(style: String) async {
        isWorking = true
        defer { isWorking = false }
        do {
            render = try await api.renderMemo(
                memoId: memoId, style: style, tweaks: tweaks
            )
            errorMessage = nil
        } catch {
            errorMessage = "Remix failed — try again"
        }
    }

    private func publish() async {
        isWorking = true
        defer { isWorking = false }
        do {
            post = try await api.createPost(
                renderId: render.id,
                author: AppConfig.authorHandle,
                caption: ""
            )
            errorMessage = nil
        } catch {
            errorMessage = "Posting failed — try again"
        }
    }
}
