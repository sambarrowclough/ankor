import { Component, FunctionComponent, ReactNode } from 'react'
import CreatableSelect from 'react-select/creatable'
import { OnChangeValue, StylesConfig } from 'react-select'
import { usePopper } from 'react-popper'

export interface StateOption {
    readonly value: string
    readonly label: string
}

export const stateOptions: readonly StateOption[] = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AS', label: 'American Samoa' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District Of Columbia' },
    { value: 'FM', label: 'Federated States Of Micronesia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'GU', label: 'Guam' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MH', label: 'Marshall Islands' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'MP', label: 'Northern Mariana Islands' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PW', label: 'Palau' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'PR', label: 'Puerto Rico' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VI', label: 'Virgin Islands' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
]
// const { colors } = defaultTheme;

// const dot = (color = '#ccc') => ({
//   alignItems: 'center',
//   display: 'flex',

//   ':before': {
//     backgroundColor: color,
//     borderRadius: 10,
//     content: '" "',
//     display: 'block',
//     marginRight: 8,
//     height: 8,
//     width: 8,
//   },
// });

const selectStyles: StylesConfig<StateOption, false> = {
    control: provided => ({
        ...provided,
        minWidth: 240,
        marginTop: 1
    }),
    menu: () => ({
        boxShadow: 'inset 0 1px 0 rgb(239, 241, 244)'
    }),
    // input: styles => ({ ...styles, ...dot() }),
    // placeholder: styles => ({ ...styles, ...dot() }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
            ...styles,
            backgroundColor: (() => {
                if (isDisabled) return ''
                if (isSelected) return '#f0f3f9'
                if (isFocused) return '#f0f3f9'
            })(),
            color: isSelected ? '#282a30' : '#282a30',
            cursor: isDisabled ? 'not-allowed' : 'default',
            ':active': {
                ...styles[':active'],
                backgroundColor: isSelected ? 'green' : '#f0f3f9'
            }
        }
    }
}

// f0f3f9
// 1px solid rgb(239, 241, 244)

interface State {
    readonly isOpen: boolean
    readonly value: StateOption | null | undefined
}

export default class PopoutExample extends Component<{}, State> {
    state: State = { isOpen: false, value: undefined }
    toggleOpen = () => {
        this.setState(state => ({ isOpen: !state.isOpen }))
    }
    onSelectChange = (value: OnChangeValue<StateOption, false>) => {
        this.toggleOpen()
        this.setState({ value })
    }
    render() {
        const { isOpen, value } = this.state
        return (
            <Dropdown
                isOpen={isOpen}
                onClose={this.toggleOpen}
                target={
                    <button
                        style={{
                            background: 'white',
                            outline: 'none',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                        //iconAfter={<ClockIcon />}
                        onClick={this.toggleOpen}
                        //isSelected={isOpen}
                    >
                        <ClockIcon />
                        {/* {value ? `${value.label}` : ''} */}
                    </button>
                }
            >
                <CreatableSelect
                    autoFocus
                    backspaceRemovesValue={false}
                    components={{
                        DropdownIndicator: null,
                        IndicatorSeparator: null
                    }}
                    controlShouldRenderValue={false}
                    hideSelectedOptions={false}
                    isClearable={false}
                    menuIsOpen
                    onChange={this.onSelectChange}
                    options={stateOptions}
                    placeholder="Search..."
                    styles={selectStyles}
                    tabSelectsValue={false}
                    value={value}
                    theme={theme => ({
                        ...theme,
                        borderRadius: 8,
                        border: 'none',
                        colors: {
                            ...theme.colors,
                            primary: 'white',
                            neutral0: 'black'
                        }
                    })}
                />
            </Dropdown>
        )
    }
}

const ClockIcon = () => (
    <Svg style={{ marginRight: 2 }}>
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8 4C7.55786 4 7.25 5.58579 7.25 6V8C7.25 8.41421 7.58579 8.75 8 8.75L8.97545 8.74938C10.0284 8.74341 13 8.67969 13 8C13 7.25 9.16421 7.25 8.75 7.25V6C8.75 5.58579 8.44214 4 8 4Z"
        ></path>
    </Svg>
)

// styled components

const Menu = (props: JSX.IntrinsicElements['div']) => {
    const shadow = 'hsla(218, 50%, 10%, 0.1)'
    return (
        <div
            style={{
                backgroundColor: 'white',
                borderRadius: 8,
                //boxShadow: `0 0 0 1px ${shadow}, 0 4px 11px ${shadow}`,
                boxShadow: `rgba(0, 0, 0, 0.09) 0px 3px 12px`,
                marginTop: 8,
                position: 'absolute',
                zIndex: 2
            }}
            {...props}
        />
    )
}
const Blanket = (props: JSX.IntrinsicElements['div']) => (
    <div
        style={{
            bottom: 0,
            left: 0,
            top: 0,
            right: 0,
            position: 'fixed',
            zIndex: 1
        }}
        {...props}
    />
)
interface DropdownProps {
    readonly isOpen: boolean
    readonly target: ReactNode
    readonly onClose: () => void
}
const Dropdown: FunctionComponent<DropdownProps> = ({
    children,
    isOpen,
    target,
    onClose
}) => (
    <div style={{ position: 'absolute' }}>
        {target}
        {isOpen ? <Menu>{children}</Menu> : null}
        {isOpen ? <Blanket onClick={onClose} /> : null}
    </div>
)
const Svg = (p: JSX.IntrinsicElements['svg']) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        focusable="false"
        role="presentation"
        {...p}
    />
)
const DropdownIndicator = () => (
    <div style={{ height: 16, width: 16, marginRight: '8px', color: '#ccc' }}>
        <Svg>
            <path d="M14.7827 13.7357L10.9043 9.8563C11.7508 8.74318 12.1431 7.34997 12.0017 5.95854C11.8603 4.56711 11.1958 3.28135 10.1426 2.36138C9.08944 1.44142 7.72624 0.95593 6.32879 1.00315C4.93135 1.05037 3.60401 1.62676 2.6153 2.61572C1.6266 3.60468 1.05035 4.93236 1.00315 6.33017C0.955941 7.72797 1.4413 9.09152 2.36103 10.145C3.28076 11.1984 4.56619 11.8631 5.95726 12.0045C7.34833 12.146 8.74118 11.7536 9.85402 10.9068L13.7324 14.7862C13.8729 14.9233 14.0614 15 14.2576 15C14.4538 15 14.6422 14.9233 14.7827 14.7862C14.9218 14.6469 15 14.458 15 14.261C15 14.064 14.9218 13.8751 14.7827 13.7357V13.7357ZM2.52547 6.53482C2.52547 5.74157 2.76063 4.96613 3.20122 4.30657C3.64182 3.64701 4.26805 3.13294 5.00072 2.82938C5.7334 2.52581 6.53962 2.44639 7.31743 2.60114C8.09523 2.7559 8.8097 3.13788 9.37046 3.6988C9.93123 4.25971 10.3131 4.97435 10.4678 5.75236C10.6225 6.53037 10.5431 7.33679 10.2397 8.06966C9.93617 8.80253 9.42224 9.42892 8.76285 9.86963C8.10345 10.3103 7.32822 10.5456 6.53517 10.5456C5.47212 10.5443 4.45296 10.1213 3.70127 9.36945C2.94958 8.61756 2.52672 7.59814 2.52547 6.53482V6.53482Z"></path>
        </Svg>
    </div>
)
const ChevronDown = () => (
    <Svg style={{ marginRight: 2 }}>
        <path
            d="M8.292 10.293a1.009 1.009 0 0 0 0 1.419l2.939 2.965c.218.215.5.322.779.322s.556-.107.769-.322l2.93-2.955a1.01 1.01 0 0 0 0-1.419.987.987 0 0 0-1.406 0l-2.298 2.317-2.307-2.327a.99.99 0 0 0-1.406 0z"
            fill="currentColor"
            fillRule="evenodd"
        />
    </Svg>
)
