
import customtkinter as ctk
from tkinter import filedialog, messagebox
import threading
import time

# --- Global Settings ---
ctk.set_appearance_mode("dark")  # Force dark mode
ctk.set_default_color_theme("dark-blue")  # Sleek blue accents

class ProfessionalCyberApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- Window Setup ---
        self.title("Threat Reporting Engine v2.0")
        self.geometry("750x650")
        self.resizable(False, False)
        
        # Grid configuration for the main window
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        self._build_ui()

    def _build_ui(self):
        # --- 1. Header Section ---
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        
        ctk.CTkLabel(
            header_frame, 
            text="OPERATIONAL TASK MANAGER", 
            font=ctk.CTkFont(family="Consolas", size=24, weight="bold"),
            text_color="#00ffcc" # Cyber cyan accent
        ).pack(side="left")
        
        ctk.CTkLabel(
            header_frame, 
            text="STATUS: STANDBY", 
            font=ctk.CTkFont(family="Consolas", size=12),
            text_color="#777777"
        ).pack(side="right", pady=10)

        # --- 2. Configuration Parameters ---
        config_frame = ctk.CTkFrame(self)
        config_frame.grid(row=1, column=0, padx=20, pady=10, sticky="ew")
        
        config_frame.grid_columnconfigure(1, weight=1)

        # Helper to create clean input rows
        def create_input_row(parent, row_idx, label_text):
            ctk.CTkLabel(
                parent, text=label_text, font=ctk.CTkFont(family="Consolas", size=13)
            ).grid(row=row_idx, column=0, padx=15, pady=15, sticky="e")
            
            entry_var = ctk.StringVar()
            entry = ctk.CTkEntry(
                parent, textvariable=entry_var, 
                placeholder_text="..." ,
                font=ctk.CTkFont(family="Consolas", size=13),
                height=35
            )
            entry.grid(row=row_idx, column=1, padx=(0, 15), pady=15, sticky="ew")
            return entry_var

        self.url_var = create_input_row(config_frame, 0, "TARGET URL:")
        self.proxy_var = create_input_row(config_frame, 1, "PROXY LIST:")
        self.account_var = create_input_row(config_frame, 2, "ACCOUNT DATA:")

        # Browse Buttons
        def create_browse_btn(parent, row_idx, var):
            btn = ctk.CTkButton(
                parent, text="BROWSE", width=80, height=35,
                font=ctk.CTkFont(family="Consolas", size=12, weight="bold"),
                fg_color="#333333", hover_color="#444444",
                command=lambda: self._browse_file(var)
            )
            btn.grid(row=row_idx, column=2, padx=(0, 15), pady=15)

        create_browse_btn(config_frame, 1, self.proxy_var)
        create_browse_btn(config_frame, 2, self.account_var)

        # --- 3. System Logs ---
        log_frame = ctk.CTkFrame(self)
        log_frame.grid(row=2, column=0, padx=20, pady=10, sticky="nsew")
        log_frame.grid_columnconfigure(0, weight=1)
        log_frame.grid_rowconfigure(1, weight=1)
        
        ctk.CTkLabel(
            log_frame, text="SYSTEM LOGS", 
            font=ctk.CTkFont(family="Consolas", size=12, weight="bold"),
            text_color="#aaaaaa"
        ).grid(row=0, column=0, padx=15, pady=(10, 0), sticky="w")

        self.log_area = ctk.CTkTextbox(
            log_frame, font=ctk.CTkFont(family="Consolas", size=12),
            fg_color="#1a1a1a", text_color="#00ffcc", 
            wrap="word", state="disabled"
        )
        self.log_area.grid(row=1, column=0, padx=15, pady=(5, 15), sticky="nsew")

        # --- 4. Action Center ---
        action_frame = ctk.CTkFrame(self, fg_color="transparent")
        action_frame.grid(row=3, column=0, padx=20, pady=(10, 20), sticky="ew")
        
        self.start_btn = ctk.CTkButton(
            action_frame, text="INITIATE REPORTING SEQUENCE",
            height=45, font=ctk.CTkFont(family="Consolas", size=14, weight="bold"),
            fg_color="#990000", hover_color="#cc0000", # Threat red
            command=self._start_processing
        )
        self.start_btn.pack(fill="x")

    def _browse_file(self, string_var):
        filename = filedialog.askopenfilename(
            title="Select Configuration File", 
            filetypes=(("Text files", "*.txt"), ("All files", "*.*"))
        )
        if filename:
            string_var.set(filename)

    def _write_log(self, message):
        self.log_area.configure(state="normal")
        timestamp = time.strftime('%H:%M:%S')
        self.log_area.insert("end", f"[{timestamp}] {message}\n")
        self.log_area.see("end")
        self.log_area.configure(state="disabled")

    def _simulate_backend_task(self, target, proxy_file, account_file):
        try:
            self._write_log(f"Establishing secure connection to {target}...")
            time.sleep(1)
            
            self._write_log(f"Loading proxy pool: {proxy_file.split('/')[-1]}...")
            time.sleep(1)
            
            self._write_log(f"Loading authentication matrix: {account_file.split('/')[-1]}...")
            time.sleep(1.5)
            
            self._write_log("Execution complete. Connection terminated.")
            self._write_log("-" * 65)
            
        except Exception as e:
            self._write_log(f"[ERROR] {str(e)}")
            
        finally:
            self.start_btn.configure(state="normal", text="INITIATE REPORTING SEQUENCE")

    def _start_processing(self):
        target = self.url_var.get().strip()
        proxy_file = self.proxy_var.get().strip() or "None"
        account_file = self.account_var.get().strip() or "None"
        
        if not target:
            messagebox.showerror("Configuration Error", "Target URL is required to proceed.")
            return
            
        self.start_btn.configure(state="disabled", text="PROCESSING...")
        self._write_log("=" * 65)
        
        task_thread = threading.Thread(
            target=self._simulate_backend_task, 
            args=(target, proxy_file, account_file), 
            daemon=True
        )
        task_thread.start()

if __name__ == "__main__":
    app = ProfessionalCyberApp()
    app.mainloop()