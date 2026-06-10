import SwiftUI

struct StylePickerView: View {
    let memoFileURL: URL

    private let api = APIClient()
    @State private var styles: [Style] = []
    @State private var isWorking = false
    @State private var memoId: String?
    @State private var render: Render?
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let render, let memoId {
                ResultView(memoId: memoId, styles: styles, render: render)
            } else if isWorking {
                ProgressView("Remixing…")
            } else {
                List(styles) { style in
                    Button {
                        Task { await remix(style: style) }
                    } label: {
                        VStack(alignment: .leading) {
                            Text(style.label).font(.headline)
                            Text(style.description)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Pick a vibe")
        .task { await loadStyles() }
        .overlay(alignment: .bottom) {
            if let errorMessage {
                Text(errorMessage).font(.footnote).foregroundStyle(.red)
            }
        }
    }

    private func loadStyles() async {
        do {
            styles = try await api.fetchStyles()
        } catch {
            errorMessage = "Could not reach the recorder bot"
        }
    }

    private func remix(style: Style) async {
        isWorking = true
        defer { isWorking = false }
        do {
            let memo = try await api.uploadMemo(fileURL: memoFileURL)
            memoId = memo.id
            render = try await api.renderMemo(memoId: memo.id, style: style.id)
        } catch {
            errorMessage = "Remix failed — try again"
        }
    }
}
