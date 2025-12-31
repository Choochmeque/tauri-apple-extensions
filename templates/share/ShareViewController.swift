import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    // MARK: - Configuration
    private let appGroupIdentifier = "{{APP_GROUP_IDENTIFIER}}"
    private let appURLScheme = "{{APP_URL_SCHEME}}"

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        // TODO: Setup your UI here
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        processSharedItems()
    }

    // MARK: - Share Processing

    private func processSharedItems() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            complete()
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }

            for attachment in attachments {
                // TODO: Handle different content types
                // Examples:
                //   - UTType.image.identifier for images
                //   - UTType.url.identifier for URLs
                //   - UTType.text.identifier for text
                //   - UTType.fileURL.identifier for files

                if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] item, error in
                        if let url = item as? URL {
                            // TODO: Process the URL
                            print("Received URL: \(url)")
                        }
                        DispatchQueue.main.async {
                            self?.complete()
                        }
                    }
                    return
                }

                if attachment.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.text.identifier) { [weak self] item, error in
                        if let text = item as? String {
                            // TODO: Process the text
                            print("Received text: \(text)")
                        }
                        DispatchQueue.main.async {
                            self?.complete()
                        }
                    }
                    return
                }

                if attachment.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.image.identifier) { [weak self] item, error in
                        if let url = item as? URL {
                            // TODO: Process image file URL
                            print("Received image: \(url)")
                        } else if let image = item as? UIImage {
                            // TODO: Process UIImage directly
                            print("Received UIImage")
                        }
                        DispatchQueue.main.async {
                            self?.complete()
                        }
                    }
                    return
                }
            }
        }

        complete()
    }

    // MARK: - App Group Storage (Optional)

    /// Save data to App Group for main app to read
    private func saveToAppGroup(_ data: Data, forKey key: String) -> Bool {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            print("App Groups not configured")
            return false
        }
        userDefaults.set(data, forKey: key)
        return true
    }

    /// Get App Group container URL for file storage
    private func appGroupContainerURL() -> URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier)
    }

    // MARK: - Open Main App (Optional)

    private func openMainApp() {
        guard let url = URL(string: "\(appURLScheme)://share") else { return }

        var responder: UIResponder? = self
        while let r = responder {
            if let application = r as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = r.next
        }
    }

    // MARK: - Complete

    private func complete() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
