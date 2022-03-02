import './expect-type';

declare global {
	namespace jest {
		interface Expect {
			// eslint-disable-next-line @typescript-eslint/prefer-function-type -- Declaration merging
			<T = any>( actual: T, message?: string ): JestMatchers<T>;
		}
	}
}
