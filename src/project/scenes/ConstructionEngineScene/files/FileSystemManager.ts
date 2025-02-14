// src/engine/scenes/ConstructionEngineScene/files/FileSystemManager.ts
declare global {
	interface Window {
		showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
	}
}

export class FileSystemManager {
	private savedProjectsDirHandle: FileSystemDirectoryHandle | null = null;

	public async getOrCreateSavedProjectsFolder(): Promise<FileSystemDirectoryHandle> {
		if (!this.savedProjectsDirHandle) {
			if (!window.showDirectoryPicker) {
				throw new Error("La API File System Access no está soportada en este navegador.");
			}
			// Se pide al usuario que seleccione una carpeta padre
			const parentHandle = await window.showDirectoryPicker();
			this.savedProjectsDirHandle = await parentHandle.getDirectoryHandle("savedProyects", { create: true });
		}
		return this.savedProjectsDirHandle;
	}

	public async exportStateToFile(data: string, filename: string = "state.json"): Promise<void> {
		const folderHandle = await this.getOrCreateSavedProjectsFolder();
		const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
		// Se usa "any" para acceder a createWritable
		const writable = await (fileHandle as any).createWritable();
		await writable.write(data);
		await writable.close();
		console.log("Estado exportado a:", filename);
	}

	public async saveStateDirectly(data: string, filename: string = "state.json"): Promise<void> {
		if (!this.savedProjectsDirHandle) {
			console.error("No se tiene acceso previo a la carpeta 'savedProyects'.");
			return;
		}
		try {
			const fileHandle = await this.savedProjectsDirHandle.getFileHandle(filename, { create: false });
			const writable = await (fileHandle as any).createWritable();
			await writable.write(data);
			await writable.close();
			console.log("Estado sobrescrito en:", filename);
		} catch (error) {
			console.error("Error al sobrescribir el estado:", error);
		}
	}

	public async createLoadPanel(callback: (data: string) => void): Promise<HTMLElement> {
		// Por simplicidad, devolvemos un elemento HTML con botones para cada archivo.
		const panel = document.createElement("div");
		panel.style.position = "absolute";
		panel.style.top = "100px";
		panel.style.left = "50px";
		panel.style.background = "#333";
		panel.style.color = "#fff";
		panel.style.padding = "10px";

		const folderHandle = await this.getOrCreateSavedProjectsFolder();
		for await (const [name, handle] of (folderHandle as any).entries()) {
			if (name.endsWith(".json") && handle.kind === "file") {
				const button = document.createElement("button");
				button.textContent = name;
				button.onclick = async () => {
					const fileHandle = handle as FileSystemFileHandle;
					const file = await fileHandle.getFile();
					const text = await file.text();
					callback(text);
				};
				panel.appendChild(button);
			}
		}
		return panel;
	}
}
