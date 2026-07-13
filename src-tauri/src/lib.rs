use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // 启动时注销 Service Worker 并清除缓存
                // 如果检测到旧 SW，注销后自动刷新页面加载新代码
                let _ = window.eval(r#"
                    (async function() {
                        try {
                            let hadSW = false;
                            if ('serviceWorker' in navigator) {
                                const regs = await navigator.serviceWorker.getRegistrations();
                                hadSW = regs.length > 0;
                                for (const r of regs) await r.unregister();
                            }
                            if ('caches' in window) {
                                const keys = await caches.keys();
                                for (const k of keys) await caches.delete(k);
                            }
                            if (hadSW) window.location.reload();
                        } catch(e) {}
                    })();
                "#);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
