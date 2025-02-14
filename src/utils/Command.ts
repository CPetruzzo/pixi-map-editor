/** I make a class Command with an execute function that can be overwritten for every command that's needed
 * @abstract This class will allow me to change the button in case I want to let the player select what he can do
 */
export class Command {
	constructor() {}
	public execute(): any {}
}
